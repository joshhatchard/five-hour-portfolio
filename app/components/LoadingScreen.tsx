"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Box3,
  Group,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPoser } from "./hero-dive/poser";
import { sampleDive } from "./hero-dive/divePose";
import { createStickmanMaterial, disposeModel } from "./callToActionMaterial";
import type { ScrollRuntime } from "./warp-grid/ScrollProvider";
import styles from "./LoadingScreen.module.css";

const MINIMUM_VISIBLE_MS = 1500;
const FALLBACK_DISMISS_MS = 3500;
const EXIT_DURATION_MS = 420;
const LOADER_INK: [number, number, number] = [17 / 255, 18 / 255, 14 / 255];
const LOADER_PAPER: [number, number, number] = [1, 1, 1];

type Props = { runtime: RefObject<ScrollRuntime> };

export default function LoadingScreen({ runtime }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    document.documentElement.dataset.portfolioReady = "true";
    window.dispatchEvent(new Event("portfolio-ready"));
  }, [phase]);

  useEffect(() => {
    if (phase === "done") return;
    const resetToHero = () => {
      const lenis = runtime.current.lenis;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
      }
      window.scrollTo(0, 0);
    };
    const previousRestoration = history.scrollRestoration;
    const preventScroll = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const preventScrollKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) preventScroll(event);
    };
    window.addEventListener("wheel", preventScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", preventScroll, { passive: false, capture: true });
    window.addEventListener("keydown", preventScrollKey, true);
    history.scrollRestoration = "manual";
    resetToHero();
    const frame = requestAnimationFrame(resetToHero);
    const interval = window.setInterval(resetToHero, 50);
    window.addEventListener("scroll", resetToHero, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
      window.removeEventListener("scroll", resetToHero);
      window.removeEventListener("wheel", preventScroll, true);
      window.removeEventListener("touchmove", preventScroll, true);
      window.removeEventListener("keydown", preventScrollKey, true);
      history.scrollRestoration = previousRestoration;
    };
  }, [phase, runtime]);

  useEffect(() => {
    if (phase !== "loading") return;
    const startedAt = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The full loader has its own WebGL model. On phones that is an expensive
    // fourth renderer and, on some mobile browsers, can prevent the loader
    // from ever reporting ready. Keep the short handoff but skip WebGL.
    if (window.matchMedia("(max-width: 700px)").matches) {
      setReady(true);
      const leaveTimer = window.setTimeout(() => setPhase("leaving"), 450);
      return () => clearTimeout(leaveTimer);
    }

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      const leaveTimer = window.setTimeout(() => {
        setPhase("leaving");
      }, 0);
      return () => {
        clearTimeout(leaveTimer);
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = NoToneMapping;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 100);
    camera.position.z = 10;
    const spin = new Group();
    scene.add(spin);
    const material = createStickmanMaterial(renderer.getPixelRatio(), {
      ink: LOADER_INK,
      paper: LOADER_PAPER,
    });
    let active = true;
    let frame = 0;
    let model: Group | null = null;
    let modelReady = false;
    let documentReady = document.readyState === "complete";
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      const delay = Math.max(0, MINIMUM_VISIBLE_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (!active) return;
        setPhase("leaving");
      }, delay);
    };
    const checkReady = () => {
      if (modelReady && documentReady) {
        setReady(true);
        dismiss();
      }
    };
    const onPageLoad = () => {
      documentReady = true;
      checkReady();
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      material.uniforms.uPx.value = renderer.getPixelRatio();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    window.addEventListener("load", onPageLoad, { once: true });

    new GLTFLoader().load("/models/stickman.glb", (gltf) => {
      if (!active) {
        disposeModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      createPoser(model).apply({
        ...sampleDive(0), yaw: 0, hips: 0, spine: 0, head: 0,
        armRaise: 35, armSwing: 0, elbow: 0, spread: 32, thigh: 0, shin: 0, foot: 0,
      });
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const original = object.geometry;
        object.geometry = toCreasedNormals(original, Math.PI);
        original.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((item) => item.dispose());
        object.material = material;
        object.frustumCulled = false;
      });
      const box = new Box3().setFromObject(model, true);
      const size = box.getSize(new Vector3());
      const scale = 2.35 / Math.max(size.x, size.y);
      model.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
      model.scale.setScalar(scale);
      spin.add(model);
      modelReady = true;
      checkReady();
    }, undefined, () => {
      setReady(true);
      dismiss();
    });

    const render = (time: number) => {
      if (!active) return;
      spin.rotation.y = time * 0.0011;
      spin.rotation.z = Math.sin(time * 0.0015) * 0.08;
      material.uniforms.uSeed.value = Math.floor(time / 45) % 64;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const fallback = window.setTimeout(dismiss, FALLBACK_DISMISS_MS);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      observer.disconnect();
      window.removeEventListener("load", onPageLoad);
      if (model) disposeModel(model);
      material.dispose();
      renderer.dispose();
    };
  }, [phase]);

  if (phase === "done") return null;
  return (
    <div className={styles.screen} data-leaving={phase === "leaving"} data-ready={ready} aria-busy="true" aria-label="Loading portfolio">
      <div className={styles.stack}>
        <canvas ref={canvasRef} className={styles.model} aria-hidden="true" />
        <div className={styles.progress} aria-hidden="true"><span /></div>
        <p className={styles.label}>Loading the good stuff</p>
      </div>
    </div>
  );
}
