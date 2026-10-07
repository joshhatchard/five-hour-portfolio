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
    let opacity = 0;
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    const geometry = new PlaneGeometry(1, 1, 1, warpConfig.segments);
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
    scene.add(mesh);
    const measurePosition = () => {
      const bounds = image.getBoundingClientRect();
      rect = { left: bounds.left, top: bounds.top + window.scrollY, width: bounds.width, height: bounds.height };
    };
    const measure = () => {
      measurePosition();
      if (image.naturalWidth && rect.height) {
        const imageAspect = image.naturalWidth / image.naturalHeight;
        const planeAspect = rect.width / rect.height;
        material.uniforms.uUvScale.value.set(Math.min(1, planeAspect / imageAspect), Math.min(1, imageAspect / planeAspect));
      }
    };
    const texture = new TextureLoader().load(entry.src, (loaded) => {
      if (!active) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
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
      // Cards may parallax independently, so the DOM media and its canvas
      // counterpart need a fresh screen position on each shared scroll tick.
      measurePosition();
      const top = rect.top - scrollState.scroll;
      mesh.visible = ready && rect.width > 0 && top < size.height + 100 && top + rect.height > -100;
      if (!mesh.visible) return;
      mesh.position.set(rect.left + rect.width / 2 - size.width / 2, size.height / 2 - top - rect.height / 2, 0);
      mesh.scale.set(rect.width, rect.height, 1);
      material.uniforms.uVelocity.value = scrollState.velocity / warpConfig.maxVelocity * strength;
      opacity = Math.min(1, opacity + scrollState.delta / warpConfig.fadeDuration);
      material.uniforms.uOpacity.value = opacity;
      image.style.opacity = String(1 - opacity);
    };
    scrollState.update.add(update);
    scrollState.refresh.add(measure);
    image.addEventListener("load", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(image);
    measure();
    return () => {
      active = false;
      scrollState.update.delete(update);
      scrollState.refresh.delete(measure);
      observer.disconnect();
      image.removeEventListener("load", measure);
      image.style.removeProperty("opacity");
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [entry, gl, runtime, scene, size.width, size.height]);
  return null;
}
