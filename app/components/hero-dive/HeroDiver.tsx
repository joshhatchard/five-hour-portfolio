"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  SkinnedMesh,
  SphereGeometry,
  Texture,
  Vector3,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useScrollRuntime } from "../warp-grid/ScrollProvider";
import { createPoser } from "./poser";
import { boardDipPx, diveConfig, flight, smooth } from "./controller";
import { sampleDive } from "./divePose";

// Scroll-driven camera orbit around the diver for the whole dive.
const ORBIT_TURNS = 1; // full 360° laps between ORBIT_START and ORBIT_END (use a whole number so it ends flat)
const ORBIT_DIRECTION = 1; // 1 or -1 to spin the other way
const ORBIT_ELEVATION = (16 * Math.PI) / 180; // how high the camera rises mid-orbit
const ORBIT_START = 0.2; // progress where the orbit begins (matches camera follow start)
const ORBIT_END = diveConfig.cameraNeutral; // progress where it finishes back on the flat 2D view
const CAM_DIST = 1000;

// Black & white pencil-sketch look (colours are authored in sRGB, 0..1).
const INK_RGB: [number, number, number] = [17 / 255, 18 / 255, 13 / 255]; // #11120d
const PAPER_RGB: [number, number, number] = [1, 1, 1]; // #ffffff
const LIGHT_DIR: [number, number, number] = [-0.55, 0.75, 0.6]; // world-space light, so shading changes as the camera orbits
const LINE_GAP = 6; // distance between hatch lines in CSS pixels (smaller = denser, darker)
const OUTLINE = 0.3; // 0 = no outline, higher = thicker scribbled edge around the silhouette
const BOIL_STEPS = 48; // how often the sketch lines redraw as you scroll (higher = more jittery "boil")

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  #include <common>
  #include <skinning_pars_vertex>
  void main() {
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    vNormal = transformedNormal;
    #include <begin_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform vec3 uLight;
  uniform float uPx;      // device pixels per CSS pixel
  uniform float uGap;
  uniform float uOutline;
  uniform float uSeed;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // One layer of wobbly, broken pencil strokes. width is half-width in line-gap units (0..0.5).
  float hatch(vec2 frag, float angle, float gap, float width, float seed) {
    if (width <= 0.001) return 0.0;
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 perp = vec2(-dir.y, dir.x);
    float along = dot(frag, dir);
    float across = dot(frag, perp);
    // lines wander off-straight, like a hand drawing them
    across += (vnoise(vec2(along * 0.018, seed * 1.7 + angle * 3.0)) - 0.5) * gap * 1.1;
    float row = across / gap;
    float id = floor(row);
    float f = fract(row) - 0.5;
    float lineRand = hash(vec2(id, seed + angle));
    // pressure: stroke thickness varies along its length
    float w = width * (0.55 + 0.9 * vnoise(vec2(along * 0.06 + lineRand * 40.0, id * 3.1 + seed)));
    // strokes lift off the paper now and then
    float stroke = step(0.12, vnoise(vec2(along * 0.011 + lineRand * 60.0, id + seed * 0.37)));
    float aa = max(fwidth(row), 0.001);
    return (1.0 - smoothstep(w - aa, w + aa, abs(f))) * stroke;
  }

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec2 frag = gl_FragCoord.xy / uPx; // CSS pixels, so the sketch scale is the same on retina screens

    // Light is fixed in world space; convert to view space so it stays put while the camera orbits.
    vec3 L = normalize(mat3(viewMatrix) * uLight);
    float lit = dot(n, L);
    float dark = 1.0 - smoothstep(-0.1, 0.7, lit); // 0 = fully lit, 1 = deep shadow

    // Cross-hatching builds up as the surface gets darker.
    float h1 = hatch(frag, 0.785, uGap, 0.5 * smoothstep(0.12, 0.85, dark), uSeed);
    float h2 = hatch(frag, -0.785, uGap, 0.5 * smoothstep(0.45, 0.95, dark), uSeed + 11.0);
    float h3 = hatch(frag, 0.18, uGap * 0.8, 0.5 * smoothstep(0.75, 1.0, dark), uSeed + 23.0);
    float shade = max(h1, max(h2, h3));

    // Scribbled outline: a wobbly main edge plus a broken overshoot line just outside it.
    float edge = n.z + (vnoise(frag * 0.09 + uSeed) - 0.5) * 0.28;
    float rim = 1.0 - smoothstep(uOutline * 0.6, uOutline, edge);
    float edge2 = n.z + (vnoise(frag * 0.05 + uSeed + 9.0) - 0.5) * 0.34;
    float ring = smoothstep(uOutline * 1.0, uOutline * 1.1, edge2)
               * (1.0 - smoothstep(uOutline * 1.22, uOutline * 1.34, edge2))
               * step(0.5, vnoise(frag * 0.045 + uSeed * 0.5 + 3.0));

    float coverage = max(shade, max(rim, ring));

    // Hard threshold: every pixel is pure ink or pure paper, no grey in between.
    gl_FragColor = vec4(coverage > 0.5 ? uInk : uPaper, 1.0);
  }
`;

function parseRgb(css: string, out: Vector3) {
  const m = css.match(/[\d.]+/g);
  if (m && m.length >= 3) out.set(+m[0] / 255, +m[1] / 255, +m[2] / 255);
}

function disposeMaterial(material: Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof Texture) value.dispose();
  });
  material.dispose();
}

function disposeModel(root: Object3D) {
  root.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach(disposeMaterial);
      if (object instanceof SkinnedMesh) object.skeleton.dispose();
    }
  });
}

export default function HeroDiver() {
  const { gl } = useThree();
  const { runtime } = useScrollRuntime();
  useEffect(() => {
    const state = runtime.current;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
    camera.position.z = CAM_DIST;
    const tumble = new Group();
    const yaw = new Group();
    const offset = new Group();
    scene.add(tumble);
    tumble.add(yaw);
    yaw.add(offset);
    let active = true;
    let root: Object3D | null = null;
    let poser: ReturnType<typeof createPoser> | null = null;
    let modelHeight = 1;
    let hipRatio = 0.45;
    let skin: ShaderMaterial | null = null;
    let eye: Mesh | null = null;
    const point = new Vector3();
    const posedBounds = new Box3();
    // Hip height at the moment of take-off, measured from the posed model so the leap starts exactly where the planted pose ends.
    let launchKey = "";
    let launchY = 0;

    new GLTFLoader().load(
      "/models/stickman.glb",
      (gltf) => {
        if (!active) {
          disposeModel(gltf.scene);
          return;
        }
        root = gltf.scene;
        poser = createPoser(root);
        poser.apply(sampleDive(0));
        const bounds = new Box3().setFromObject(root, true);
        modelHeight = bounds.max.y - bounds.min.y;
        const hips = poser.hips.getWorldPosition(new Vector3());
        hipRatio = (hips.y - bounds.min.y) / modelHeight;
        skin = new ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          uniforms: {
            uInk: { value: new Vector3(...INK_RGB) },
            uPaper: { value: new Vector3(...PAPER_RGB) },
            uLight: { value: new Vector3(...LIGHT_DIR).normalize() },
            uPx: { value: gl.getPixelRatio() },
            uGap: { value: LINE_GAP },
            uOutline: { value: OUTLINE },
            uSeed: { value: 0 },
          },
        });
        root.traverse((object) => {
          if (object instanceof Mesh) {
            // Average normals across all faces so the low-poly mesh doesn't show up as facets in the shading.
            const faceted = object.geometry;
            object.geometry = toCreasedNormals(faceted, Math.PI);
            faceted.dispose();
            const originals = Array.isArray(object.material)
              ? object.material
              : [object.material];
            originals.forEach(disposeMaterial);
            object.material = skin!;
            object.frustumCulled = false;
          }
        });
        offset.position.copy(hips).negate();
        offset.add(root);
        eye = new Mesh(
          new SphereGeometry(0.034, 12, 8),
          new MeshBasicMaterial({ color: "white" }),
        );
        // Place the eye on the visible side of the head, expressed in bone space.
        const head = poser.bones.get("Head_05")!;
        root.updateMatrixWorld(true);
        const eyeWorld = head
          .getWorldPosition(new Vector3())
          .add(new Vector3(0.09, 0.15, 0.115));
        eye.position.copy(head.worldToLocal(eyeWorld));
        eye.scale.setScalar(100); // the FBX skeleton is centimetres, scene is metres
        head.add(eye);
      },
      undefined,
      () => {
        if (!active) return;
        // Keep the original SVG and readable static hero if the model fails.
        document
          .querySelector("#hero")
          ?.setAttribute("data-model-failed", "true");
        window.dispatchEvent(new Event("hero-renderer-unavailable"));
      },
    );

    const draw = () => {
      const hero = state.heroes.values().next().value;
      if (!root || !poser || !hero || !hero.visible) return;
      const p = hero.progress;
      const rootObj = root;
      const poserObj = poser;
      const scale = hero.figureHeight / modelHeight;

      // Measure the hip height at take-off (cached until the layout/scale changes).
      const resetNeutral = () => {
        tumble.position.set(0, 0, 0);
        tumble.rotation.set(0, 0, 0);
        tumble.scale.setScalar(1);
        yaw.rotation.set(0, 0, 0);
        scene.updateMatrixWorld(true);
      };
      let launchHip: number | undefined;
      if (p >= diveConfig.launch) {
        const key = `${hero.startFootY.toFixed(2)}|${scale.toFixed(5)}`;
        if (key !== launchKey) {
          const lp = sampleDive(diveConfig.launch);
          resetNeutral();
          poserObj.apply(lp);
          tumble.scale.setScalar(scale);
          yaw.rotation.y = (-lp.yaw * Math.PI) / 180;
          scene.updateMatrixWorld(true);
          posedBounds.setFromObject(rootObj, true);
          launchY = hero.startFootY + posedBounds.min.y;
          launchKey = key;
        }
        launchHip = launchY;
      }

      // Apply the supplied world-space poser in a neutral parent frame first.
      resetNeutral();
      const motion = flight(hero, hero.figureHeight * hipRatio, launchHip);
      const pointerX = Number(getComputedStyle(hero.element).getPropertyValue("--hero-pointer-x")) || 0;
      const pointerY = Number(getComputedStyle(hero.element).getPropertyValue("--hero-pointer-y")) || 0;
      // Before the leap, let the figure acknowledge the cursor with a small
      // balancing turn and arm response. The authored dive pose takes over at
      // launch, so this cannot disturb the airborne choreography.
      const idle = 1 - smooth(0.1, diveConfig.launch, p);
      const pose = idle > 0
        ? {
            ...motion.pose,
            armSwing: motion.pose.armSwing + pointerX * 18 * idle,
            armStride: motion.pose.armStride + pointerX * 14 * idle,
            armRaise: motion.pose.armRaise - pointerY * 10 * idle,
            head: motion.pose.head + pointerY * 4 * idle,
          }
        : motion.pose;
      poserObj.apply(pose);
      tumble.scale.setScalar(scale);
      // Mirror the authored flips to face left into the landing.
      const twist = motion.pose.yaw - sampleDive(0).yaw;
      yaw.rotation.y = (-motion.pose.yaw * Math.PI) / 180 + pointerX * 0.18 * idle;
      tumble.rotation.z = (-motion.pose.rotZ * Math.PI) / 180;
      if (p < diveConfig.launch) {
        scene.updateMatrixWorld(true);
        posedBounds.setFromObject(rootObj, true);
        // Crouching and pushing off: keep the lowest point of the figure on the board
        // (which flexes under the load), until the feet leave it.
        motion.y = hero.startFootY + posedBounds.min.y + boardDipPx(hero);
      }
      if (p >= diveConfig.cameraNeutral) {
        // Match the feet to the held waterline using the actual posed model,
        // including the smaller responsive figure on mobile.
        scene.updateMatrixWorld(true);
        posedBounds.setFromObject(rootObj, true);
        const landingY = hero.height * 0.66 + posedBounds.min.y
          + smooth(diveConfig.impact, 1, p) * hero.figureHeight * 1.8;
        motion.y += (landingY - motion.y) * smooth(diveConfig.cameraNeutral, diveConfig.impact, p);
      }
      tumble.position.set(
        motion.x - hero.width / 2,
        hero.height / 2 - motion.y,
        0,
      );
      if (p === 0) tumble.position.y -= hero.stageTop;
      // Match the hero scene's pointer parallax while the figure is still
      // standing on the cliff, then ease it out before the dive takes over.
      const pointerDepth = 1 - smooth(0.06, 0.24, p);
      tumble.position.x += pointerX * 20 * pointerDepth;
      tumble.position.y -= pointerY * 15 * pointerDepth;
      if (skin) {
        parseRgb(hero.ink, skin.uniforms.uInk.value as Vector3);
        skin.uniforms.uPx.value = gl.getPixelRatio();
        // Quantise to scroll progress so the lines re-jitter as you scroll, like redrawn frames.
        skin.uniforms.uSeed.value = Math.floor(p * BOIL_STEPS) % 64;
      }
      const follow =
        smooth(0.18, 0.34, p) * (1 - smooth(0.62, diveConfig.cameraNeutral, p));
      // The camera trails below the diver while they rocket upward, then catches up at the top of the arc,
      // so the diver visibly rises through the frame instead of staying locked at the centre.
      const lag =
        hero.height *
        diveConfig.camLag *
        smooth(diveConfig.launch, 0.3, p) *
        (1 - smooth(0.34, 0.5, p));
      hero.zoom =
        1 +
        ((hero.width < 768 ? diveConfig.mobileZoom : diveConfig.zoom) - 1) *
          follow;
      hero.cameraX = tumble.position.x * follow;
      hero.cameraY = (tumble.position.y - hero.height * 0.02 - lag) * follow;
      camera.left = -hero.width / 2;
      camera.right = hero.width / 2;
      camera.top = hero.height / 2;
      camera.bottom = -hero.height / 2;
      camera.zoom = hero.zoom;

      // Continuous orbit tied to scroll progress. `spin` eases 0 → 1 across the dive,
      // so the camera completes ORBIT_TURNS full laps and lands exactly back on the
      // flat 2D view (az = a multiple of 360°, el = 0) before the water entry.
      const spin = smooth(ORBIT_START, ORBIT_END, p);
      const az = ORBIT_DIRECTION * spin * ORBIT_TURNS * Math.PI * 2;
      const el = Math.sin(spin * Math.PI) * ORBIT_ELEVATION;
      camera.position.set(
        hero.cameraX + CAM_DIST * Math.sin(az) * Math.cos(el),
        hero.cameraY + CAM_DIST * Math.sin(el),
        CAM_DIST * Math.cos(az) * Math.cos(el),
      );
      camera.lookAt(hero.cameraX, hero.cameraY, 0);

      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      scene.updateMatrixWorld(true);
      hero.diverX = motion.x;
      hero.diverY = motion.y;
      hero.renderDom();
      // Measurements exposed on the section make responsive alignment auditable.
      hero.element.dataset.cameraZoom = hero.zoom.toFixed(3);
      hero.element.dataset.diverX = motion.x.toFixed(2);
      hero.element.dataset.diverY = motion.y.toFixed(2);
      hero.element.dataset.twistDegrees = twist.toFixed(2);
      hero.element.dataset.flipDegrees = motion.pose.rotZ.toFixed(2);
      hero.element.dataset.runStride = motion.pose.stride.toFixed(2);
      hero.element.dataset.armStride = motion.pose.armStride.toFixed(2);
      if (eye) {
        eye.getWorldPosition(point);
        point.project(camera);
        hero.element.dataset.headScreenY = (
          ((1 - point.y) * hero.height) /
          2
        ).toFixed(2);
      }
      poser.bones.get("LeftFoot_017")!.getWorldPosition(point);
      point.project(camera);
      hero.element.dataset.footScreenY = (
        ((1 - point.y) * hero.height) /
        2
      ).toFixed(2);
      // The shared work heading sits across both sections. Clip the diver at
      // the waterline so the section can cover it without trapping the heading
      // inside a separate stacking context.
      const waterHeight = Math.max(0, Math.min(hero.height, hero.waterline));
      gl.setScissor(0, hero.height - waterHeight, hero.width, waterHeight);
      gl.setScissorTest(true);
      gl.render(scene, camera);
      gl.setScissorTest(false);
      // Hide the SVG only after this controller has actually drawn the model.
      hero.element.dataset.modelReady = "true";
      const canvasHost = document.querySelector<HTMLElement>("[data-warp-canvas]");
      if (canvasHost) canvasHost.dataset.heroFigureReady = "true";
      hero.element.dataset.modelFacing =
        Math.sin(yaw.rotation.y) >= 0 ? "right" : "left";
    };
    state.backgroundRender.add(draw);
    return () => {
      active = false;
      state.backgroundRender.delete(draw);
      document.querySelector("#hero")?.removeAttribute("data-model-ready");
      document.querySelector<HTMLElement>("[data-warp-canvas]")?.removeAttribute("data-hero-figure-ready");
      if (root) disposeModel(root);
      scene.clear();
    };
  }, [gl, runtime]);
  return null;
}
