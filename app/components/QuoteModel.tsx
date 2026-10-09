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
    const headPivot = new Group();
    scene.add(spin);
    spin.add(headPivot);
    const material = createStickmanMaterial(renderer.getPixelRatio());
    let active = true;
    let model: Group | null = null;
    let idleAngle = 0;
    let dragAngle = 0;
    let dragPitch = 0;
    let renderedAngle = 0;
    let renderedPitch = 0;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let lastFrame = performance.now();

    const canInteract = () => actor.dataset.interactive === "true";
    const startDrag = (event: PointerEvent) => {
      if (!canInteract()) return;
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      actor.dataset.dragging = "true";
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
    const drag = (event: PointerEvent) => {
      if (!dragging) return;
      dragAngle += (event.clientX - pointerX) * 0.015;
      dragPitch = Math.max(-0.95, Math.min(0.95, dragPitch + (event.clientY - pointerY) * 0.01));
      pointerX = event.clientX;
      pointerY = event.clientY;
    };
    const endDrag = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      dragPitch = 0;
      delete actor.dataset.dragging;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerdown", startDrag);
    canvas.addEventListener("pointermove", drag);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    new GLTFLoader().load("/models/stickman.glb", gltf => {
      if (!active) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      const poser = createPoser(model);
      poser.apply({ ...sampleDive(0), yaw: 0, hips: 0, spine: 0, head: 0, armRaise: 35, armSwing: 0, elbow: 0, spread: 32, thigh: 0, shin: 0, foot: 0 });
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
      model.updateMatrixWorld(true);
      const headPosition = poser.bones.get("Head_05")!.getWorldPosition(new Vector3());
      const modelPosition = box.getCenter(new Vector3()).multiplyScalar(-scale);
      const pivotPosition = headPosition.multiplyScalar(scale).add(modelPosition);
      headPivot.position.copy(pivotPosition);
      model.position.copy(modelPosition).sub(pivotPosition);
      model.scale.setScalar(scale);
      headPivot.add(model);
      actor.dataset.modelReady = "true";
    }, undefined, () => {});
    const render = () => {
      const section = actor.closest("section")!.getBoundingClientRect();
      if (!model || section.bottom < 0 || section.top > innerHeight) return;
      const style = getComputedStyle(actor);
      if (style.visibility === "hidden") return;
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const degrees = parseFloat(style.getPropertyValue("--quote-spin")) || 0;
      const idleAmount = Math.max(0, Math.min(1, parseFloat(style.getPropertyValue("--quote-idle")) || 0));
      const idle = idleAmount > 0;
      const pointerX = parseFloat(style.getPropertyValue("--cta-pointer-x")) || 0;
      const pointerY = parseFloat(style.getPropertyValue("--cta-pointer-y")) || 0;
      actor.dataset.interactive = String(idleAmount > 0.7);
      if (idle && !dragging) idleAngle += delta * 0.9 * idleAmount;
      const scrollAngle = degrees * Math.PI / 180;
      // Preserve the accumulated idle/drag orientation through both handoffs.
      // Blending absolute angles could unwind several whole turns at once.
      const targetAngle = scrollAngle + idleAngle + dragAngle;
      renderedAngle += (targetAngle - renderedAngle) * Math.min(1, delta * 14);
      const pitchTarget = dragPitch * idleAmount;
      const pitchEase = dragging ? 14 : 3.25;
      renderedPitch += (pitchTarget - renderedPitch) * Math.min(1, delta * pitchEase);
      spin.rotation.y = renderedAngle;
      spin.rotation.x = renderedPitch;
      headPivot.rotation.x += ((-pointerY * 0.16 * idleAmount) - headPivot.rotation.x) * Math.min(1, delta * 10);
      headPivot.rotation.z += ((pointerX * -0.1 * idleAmount) - headPivot.rotation.z) * Math.min(1, delta * 10);
      material.uniforms.uSeed.value = Math.floor(degrees / 8) % 64;
      material.uniforms.uFlat.value = parseFloat(style.getPropertyValue("--quote-flat")) || 0;
      material.uniforms.uFinal.value = actor.dataset.quotePrimary === "true"
        ? 1
        : parseFloat(style.getPropertyValue("--quote-final")) || 0;
      renderer.render(scene, camera);
    };
    const renders = runtime.current.render;
    renders.add(render);
    return () => {
      active = false;
      renders.delete(render);
      canvas.removeEventListener("pointerdown", startDrag);
      canvas.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      delete actor.dataset.modelReady;
      delete actor.dataset.interactive;
      delete actor.dataset.dragging;
      if (model) disposeModel(model);
      material.dispose();
      renderer.dispose();
    };
  }, [runtime]);
  return <canvas ref={ref} aria-hidden="true" />;
}
