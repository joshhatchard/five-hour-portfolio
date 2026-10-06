import { Mesh, ShaderMaterial, SkinnedMesh, Texture, Vector3, type Material, type Object3D } from "three";

// Black & white pencil-sketch look (colours are authored in sRGB, 0..1).
const INK_RGB: [number, number, number] = [17 / 255, 18 / 255, 14 / 255]; // #11120e
const PAPER_RGB: [number, number, number] = [250 / 255, 249 / 255, 243 / 255]; // #faf9f3
const LIGHT_DIR: [number, number, number] = [-0.55, 0.75, 0.6]; // world-space light, so shading changes as the camera orbits
const LINE_GAP = 6; // distance between hatch lines in CSS pixels (smaller = denser, darker)
const OUTLINE = 0.3; // 0 = no outline, higher = thicker scribbled edge around the silhouette

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

function disposeMaterial(material: Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof Texture) value.dispose();
  });
  material.dispose();
}

export function disposeModel(root: Object3D) {
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

export function createStickmanMaterial(pixelRatio: number) {
  return new ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          uniforms: {
            uInk: { value: new Vector3(...INK_RGB) },
            uPaper: { value: new Vector3(...PAPER_RGB) },
            uLight: { value: new Vector3(...LIGHT_DIR).normalize() },
            uPx: { value: pixelRatio },
            uGap: { value: LINE_GAP },
            uOutline: { value: OUTLINE },
            uSeed: { value: 0 },
          },
        });
}

