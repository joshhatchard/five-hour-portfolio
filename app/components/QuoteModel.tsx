"use client";

import { useEffect, useRef } from "react";
import { Box3, Group, Mesh, OrthographicCamera, Scene, Vector3, WebGLRenderer, NoToneMapping } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPoser } from "./hero-dive/poser";
import { sampleDive } from "./hero-dive/divePose";
import { createStickmanMaterial, disposeModel } from "./quoteModelMaterial";
import { useScrollRuntime } from "./warp-grid/ScrollProvider";

export default function QuoteModel() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { runtime } = useScrollRuntime();
  useEffect(() => {
    const canvas = ref.current!;
    const actor = canvas.parentElement!;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(480, 480, false);
    renderer.toneMapping = NoToneMapping;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 100);
    camera.position.z = 10;
    const spin = new Group();
    scene.add(spin);
    const material = createStickmanMaterial(renderer.getPixelRatio());
    let active = true;
    let model: Group | null = null;
    new GLTFLoader().load("/models/stickman.glb", gltf => {
      if (!active) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      createPoser(model).apply({ ...sampleDive(0), yaw: 0, hips: 0, spine: 0, head: 0, armRaise: 35, armSwing: 0, elbow: 0, spread: 32, thigh: 0, shin: 0, foot: 0 });
      model.traverse(object => {
        if (!(object instanceof Mesh)) return;
        const original = object.geometry;
        object.geometry = toCreasedNormals(original, Math.PI);
        original.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => item.dispose());
        object.material = material;
        object.frustumCulled = false;
      });
      const box = new Box3().setFromObject(model, true);
      const size = box.getSize(new Vector3());
      const scale = 2.35 / Math.max(size.x, size.y);
      model.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
      model.scale.setScalar(scale);
      spin.add(model);
      actor.dataset.modelReady = "true";
    }, undefined, () => {});
    const render = () => {
      const section = actor.closest("section")!.getBoundingClientRect();
      if (!model || section.bottom < 0 || section.top > innerHeight) return;
      const style = getComputedStyle(actor);
      if (style.visibility === "hidden") return;
      const degrees = parseFloat(style.getPropertyValue("--quote-spin")) || 0;
      spin.rotation.y = degrees * Math.PI / 180;
      material.uniforms.uSeed.value = Math.floor(degrees / 8) % 64;
      material.uniforms.uFlat.value = parseFloat(style.getPropertyValue("--quote-flat")) || 0;
      material.uniforms.uFinal.value = parseFloat(style.getPropertyValue("--quote-final")) || 0;
      renderer.render(scene, camera);
    };
    const renders = runtime.current.render;
    renders.add(render);
    return () => {
      active = false;
      renders.delete(render);
      delete actor.dataset.modelReady;
      if (model) disposeModel(model);
      material.dispose();
      renderer.dispose();
    };
  }, [runtime]);
  return <canvas ref={ref} aria-hidden="true" />;
}
