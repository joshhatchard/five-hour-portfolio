"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2 } from "three";
import { warpConfig } from "./config";
import { fragmentShader, vertexShader } from "./shaders";
import { useScrollRuntime, type WarpEntry } from "./ScrollProvider";

export default function WarpPlane({ entry }: { entry: WarpEntry }) {
  const { scene, gl, size } = useThree();
  const { runtime } = useScrollRuntime();

  useEffect(() => {
    const image = entry.element;
    const scrollState = runtime.current;
    const strength = size.width < 768 ? warpConfig.mobileStrength : warpConfig.strength;
    let active = true;
    let ready = false;
    let sourceAspect = 1;
    let nearViewport = false;
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    const geometry = new PlaneGeometry(1, 1, 32, warpConfig.segments);
    const material = new ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTexture: { value: null }, uVelocity: { value: 0 },
        uViewport: { value: new Vector2(size.width, size.height) },
        uRgbShift: { value: warpConfig.rgbShift }, uOpacity: { value: 0 },
        uUvScale: { value: new Vector2(1, 1) },
      },
    });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = entry.layer ?? 0;
    scene.add(mesh);
    const measurePosition = () => {
      const bounds = image.getBoundingClientRect();
      // Use the image's live viewport rectangle. Mixing window.scrollY with
      // Lenis's virtual position made the canvas copy drift and scale away
      // from the DOM image during smooth scrolling.
      rect = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    };
    const measure = () => {
      measurePosition();
      const boxAspect = rect.width / rect.height || sourceAspect;
      material.uniforms.uUvScale.value.set(Math.min(1, boxAspect / sourceAspect), Math.min(1, sourceAspect / boxAspect));
    };
    const texture = new TextureLoader().load(entry.src, (loaded) => {
      if (!active) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      sourceAspect = loaded.image.width / loaded.image.height;
      gl.initTexture(loaded);
      material.uniforms.uTexture.value = loaded;
      ready = true;
      measure();
    }, undefined, () => {
      // Failed textures keep their accessible DOM media visible.
      ready = false;
      image.style.removeProperty("opacity");
    });
    const update = () => {
      if (!nearViewport) { mesh.visible = false; return; }
      // Cards may parallax independently, so the DOM media and its canvas
      // counterpart need a fresh screen position on each shared scroll tick.
      measurePosition();
      const top = rect.top;
      mesh.visible = ready && rect.width > 0 && top < size.height + 100 && top + rect.height > -100;
      if (!mesh.visible) return;
      mesh.position.set(rect.left + rect.width / 2 - size.width / 2, size.height / 2 - top - rect.height / 2, 0);
      mesh.scale.set(rect.width, rect.height, 1);
      material.uniforms.uVelocity.value = scrollState.velocity / warpConfig.maxVelocity * strength;
      material.uniforms.uOpacity.value = 1;
    };
    scrollState.update.add(update);
    scrollState.refresh.add(measure);
    mesh.onAfterRender = () => { image.style.opacity = "0"; };
    const observer = new ResizeObserver(measure);
    observer.observe(image);
    const visibility = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
    }, { rootMargin: "200px" });
    visibility.observe(image);
    measure();
    return () => {
      active = false;
      scrollState.update.delete(update);
      scrollState.refresh.delete(measure);
      observer.disconnect();
      visibility.disconnect();
      image.style.removeProperty("opacity");
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [entry, gl, runtime, scene, size.width, size.height]);
  return null;
}
