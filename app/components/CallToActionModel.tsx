"use client";

import { useEffect, useRef } from "react";
import { Box3, Group, Mesh, OrthographicCamera, Scene, Vector3, WebGLRenderer, NoToneMapping } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPoser } from "./hero-dive/poser";
import { sampleDive } from "./hero-dive/divePose";
import { createStickmanMaterial, disposeModel } from "./callToActionMaterial";
import { useScrollRuntime } from "./warp-grid/ScrollProvider";

export default function CallToActionModel() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { runtime } = useScrollRuntime();
  useEffect(() => {
    if (window.matchMedia("(max-width: 700px)").matches) return;
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
    let endScrollSpeed = 0;
    let touchY: number | null = null;

    const canInteract = () => actor.dataset.interactive === "true";
    const atPageEnd = () => {
      const page = document.scrollingElement;
      return Boolean(page && page.scrollHeight - page.clientHeight - page.scrollTop <= 3);
    };
    const addEndSpin = (distance: number) => {
      if (distance <= 0 || dragging || !canInteract() || !atPageEnd()) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      endScrollSpeed = Math.min(14, endScrollSpeed + Math.min(distance, 600) * 0.018);
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      addEndSpin(event.deltaY * unit);
    };
    const touchStart = (event: TouchEvent) => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    };
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) return;
      const nextY = event.touches[0].clientY;
      addEndSpin(touchY - nextY);
      touchY = nextY;
    };
    const touchEnd = () => { touchY = null; };
    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if ((event.target as Element)?.closest("input, textarea, select, button, a, [contenteditable]")) return;
      if (event.key === "ArrowDown") addEndSpin(80);
      if (event.key === "PageDown" || event.key === " ") addEndSpin(300);
    };
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", touchEnd);
    window.addEventListener("touchcancel", touchEnd);
    window.addEventListener("keydown", keyDown);
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
    let nearViewport = false;
    const visibility = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
    }, { rootMargin: "100px" });
    visibility.observe(actor.closest("section")!);
    const render = () => {
      if (!model || !nearViewport) return;
      const style = getComputedStyle(actor);
      const idleAmount = Math.max(0, Math.min(1, parseFloat(style.getPropertyValue("--cta-idle")) || 0));
      // Keep pointer eligibility current even while skipping hidden GPU work.
      actor.dataset.interactive = String(idleAmount > 0.7);
      if (style.visibility === "hidden") return;
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const degrees = parseFloat(style.getPropertyValue("--cta-spin")) || 0;
      const idle = idleAmount > 0;
      const pointerX = parseFloat(style.getPropertyValue("--cta-pointer-x")) || 0;
      const pointerY = parseFloat(style.getPropertyValue("--cta-pointer-y")) || 0;
      if (idle && !dragging) idleAngle += delta * 0.9 * idleAmount;
      if (!atPageEnd() || !idle || dragging) endScrollSpeed = 0;
      idleAngle += endScrollSpeed * delta;
      endScrollSpeed *= Math.exp(-3 * delta);
      if (endScrollSpeed < 0.001) endScrollSpeed = 0;
      const scrollAngle = degrees * Math.PI / 180;
      // Preserve the accumulated idle/drag orientation through both handoffs.
      // Blending absolute angles could unwind several whole turns at once.
      const targetAngle = scrollAngle + idleAngle + dragAngle;
      renderedAngle += (targetAngle - renderedAngle) * Math.min(1, delta * 14);
      const pitchTarget = dragPitch * idleAmount;
      const pitchEase = dragging ? 14 : 3.25;
      renderedPitch += (pitchTarget - renderedPitch) * Math.min(1, delta * pitchEase);
      spin.rotation.y = renderedAngle;
      actor.dataset.spinAngle = renderedAngle.toFixed(4);
      spin.rotation.x = renderedPitch;
      headPivot.rotation.x += ((-pointerY * 0.16 * idleAmount) - headPivot.rotation.x) * Math.min(1, delta * 10);
      headPivot.rotation.z += ((pointerX * -0.1 * idleAmount) - headPivot.rotation.z) * Math.min(1, delta * 10);
      material.uniforms.uSeed.value = Math.floor(degrees / 8) % 64;
      material.uniforms.uFlat.value = parseFloat(style.getPropertyValue("--cta-flat")) || 0;
      material.uniforms.uFinal.value = actor.dataset.ctaPrimary === "true"
        ? 1
        : parseFloat(style.getPropertyValue("--cta-final")) || 0;
      renderer.render(scene, camera);
    };
    const renders = runtime.current.render;
    renders.add(render);
    return () => {
      active = false;
      visibility.disconnect();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
      window.removeEventListener("touchcancel", touchEnd);
      window.removeEventListener("keydown", keyDown);
      renders.delete(render);
      canvas.removeEventListener("pointerdown", startDrag);
      canvas.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      delete actor.dataset.modelReady;
      delete actor.dataset.interactive;
      delete actor.dataset.dragging;
      delete actor.dataset.spinAngle;
      if (model) disposeModel(model);
      material.dispose();
      renderer.dispose();
    };
  }, [runtime]);
  return <canvas ref={ref} aria-hidden="true" />;
}
