"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2 } from "three";
import gsap from "gsap";
import { warpConfig } from "./config";
import { fragmentShader, vertexShader } from "./shaders";
import { useScrollRuntime, type WarpEntry } from "./ScrollProvider";

export default function WarpPlane({ entry }: { entry: WarpEntry }) {
  const { scene, gl, size, camera } = useThree();
  const { runtime } = useScrollRuntime();
  const viewport = useRef(size);
  const resizePlane = useRef<(() => void) | null>(null);

  useEffect(() => {
    const image = entry.element;
    const scrollState = runtime.current;
    let active = true;
    let ready = false;
    let shaderReady = false;
    let domHidden = false;
    let hoverActive = false;
    let hoverTween: gsap.core.Tween | null = null;
    let sourceAspect = 1;
    let nearViewport = false;
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    // The warp is linear across X; only Y needs subdivisions for the curve.
    const geometry = new PlaneGeometry(1, 1, 1, warpConfig.segments);
    const material = new ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTexture: { value: null }, uVelocity: { value: 0 },
        uViewport: { value: new Vector2(viewport.current.width, viewport.current.height) },
        uRgbShift: { value: warpConfig.rgbShift }, uOpacity: { value: 0 },
        uUvScale: { value: new Vector2(1, 1) },
        uHover: { value: 0 },
        uHoverEnabled: { value: image.dataset.warpHoverCard === "" ? 1 : 0 },
        uHoverDirection: { value: Number(image.dataset.warpHoverDirection ?? 0) },
        uPrimaryTexture: { value: null },
      },
    });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = entry.layer ?? 0;
    scene.add(mesh);
    // Compile while the gallery is offscreen, not on its first scroll frame.
    // Keep the DOM artwork visible until the GPU program is ready.
    void gl.compileAsync(mesh, camera, scene).then(() => {
      if (active) shaderReady = true;
    }).catch(() => {
      // Preserve the DOM fallback if the renderer cannot prepare this material.
    });
    // Category tags also use WarpPlane. Only the artwork owns the hover and
    // logo mask; a tag's much smaller bounds would overwrite that mask.
    const hoverTarget = image.hasAttribute("data-warp-hover-card")
      ? image.closest<HTMLElement>("[data-card-hover-target]")
      : null;
    const syncHoverMark = () => {
      const mark = hoverTarget?.querySelector<HTMLElement>("[data-warp-hover-mark]");
      if (!mark) return;
      const imageBounds = image.getBoundingClientRect();
      const markBounds = mark.getBoundingClientRect();
      const direction = Number(image.dataset.warpHoverDirection ?? 0);
      const horizontal = direction < 2;
      const imageLength = horizontal ? imageBounds.width : imageBounds.height;
      if (!imageLength) return;
      const leadingEdge = direction === 0
        ? markBounds.left - imageBounds.left
        : direction === 1
          ? imageBounds.right - markBounds.right
          : direction === 2
            ? markBounds.top - imageBounds.top
            : imageBounds.bottom - markBounds.bottom;
      const markLength = horizontal ? markBounds.width : markBounds.height;
      const reveal = Math.min(1, Math.max(0, (material.uniforms.uHover.value * imageLength - leadingEdge) / markLength));
      const hiddenAmount = `${100 - reveal * 100}%`;
      const clipPath = direction === 0
        ? `inset(0 ${hiddenAmount} 0 0)`
        : direction === 1
          ? `inset(0 0 0 ${hiddenAmount})`
          : direction === 2
            ? `inset(0 0 ${hiddenAmount} 0)`
            : `inset(${hiddenAmount} 0 0 0)`;
      mark.style.setProperty("clip-path", clipPath);
      mark.style.setProperty("-webkit-clip-path", clipPath);
    };
    const markFrame = requestAnimationFrame(syncHoverMark);
    const primaryTexture = image.dataset.warpHoverCard === ""
      ? new TextureLoader().load("/brand/primary-lime.svg", (loaded) => {
        loaded.colorSpace = SRGBColorSpace;
        gl.initTexture(loaded);
      })
      : null;
    material.uniforms.uPrimaryTexture.value = primaryTexture;
    const measurePosition = () => {
      const bounds = image.getBoundingClientRect();
      // Use the image's live viewport rectangle. Mixing window.scrollY with
      // Lenis's virtual position made the canvas copy drift and scale away
      // from the DOM image during smooth scrolling.
      rect = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    };
    const measure = () => {
      measurePosition();
      material.uniforms.uViewport.value.set(viewport.current.width, viewport.current.height);
      const boxAspect = rect.width / rect.height || sourceAspect;
      material.uniforms.uUvScale.value.set(Math.min(1, boxAspect / sourceAspect), Math.min(1, sourceAspect / boxAspect));
    };
    resizePlane.current = measure;
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
      const nextHoverActive = Boolean(hoverTarget?.matches(":hover, :focus-visible"));
      if (nextHoverActive !== hoverActive) {
        hoverActive = nextHoverActive;
        hoverTween?.kill();
        hoverTween = gsap.to(material.uniforms.uHover, {
          value: hoverActive ? 1 : 0,
          duration: 0.4,
          ease: "power1.inOut",
          overwrite: true,
          onUpdate: syncHoverMark,
        });
      }
      // Cards may parallax independently, so the DOM media and its canvas
      // counterpart need a fresh screen position on each shared scroll tick.
      measurePosition();
      const size = viewport.current;
      const strength = size.width < 768 ? warpConfig.mobileStrength : warpConfig.strength;
      const top = rect.top;
      mesh.visible = ready && shaderReady && rect.width > 0 && top < size.height + 100 && top + rect.height > -100;
      if (!mesh.visible) return;
      mesh.position.set(rect.left + rect.width / 2 - size.width / 2, size.height / 2 - top - rect.height / 2, 0);
      mesh.scale.set(rect.width, rect.height, 1);
      material.uniforms.uVelocity.value = scrollState.velocity / warpConfig.maxVelocity * strength;
      material.uniforms.uOpacity.value = 1;
    };
    scrollState.measure.add(update);
    scrollState.refresh.add(measure);
    mesh.onAfterRender = () => {
      if (domHidden) return;
      image.style.opacity = "0";
      domHidden = true;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(image);
    const visibility = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
    }, { rootMargin: "200px" });
    visibility.observe(image);
    measure();
    return () => {
      active = false;
      resizePlane.current = null;
      cancelAnimationFrame(markFrame);
      scrollState.measure.delete(update);
      scrollState.refresh.delete(measure);
      observer.disconnect();
      visibility.disconnect();
      image.style.removeProperty("opacity");
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      primaryTexture?.dispose();
      hoverTween?.kill();
      const mark = hoverTarget?.querySelector<HTMLElement>("[data-warp-hover-mark]");
      mark?.style.removeProperty("clip-path");
      mark?.style.removeProperty("-webkit-clip-path");
    };
  }, [entry, gl, runtime, scene, camera]);
  useEffect(() => {
    viewport.current = size;
    resizePlane.current?.();
  }, [size]);
  return null;
}
