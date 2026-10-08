"use client";

import { useEffect, useRef } from "react";
import { Camera, Geometry, Mesh, Program, Renderer } from "ogl";
import styles from "./HeroParticles.module.css";
import { diveConfig, smooth } from "./controller";

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;

  void main() {
    vec3 pos = position * 10.0;
    pos.z *= 2.4;
    pos.x += sin(uTime * 0.72 + random.z * 6.283) * (0.25 + random.x * 0.7);
    pos.y += cos(uTime * 0.56 + random.w * 6.283) * (0.25 + random.y * 0.7);
    pos.z += sin(uTime * 0.38 + random.y * 6.283) * 0.6;

    vec4 mvPos = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_PointSize = (165.0 + random.x * 235.0) / length(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float circle = smoothstep(0.5, 0.42, d);
    gl_FragColor = vec4(1.0, 1.0, 1.0, circle);
  }
`;

export default function HeroParticles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: true, depth: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.className = styles.canvas;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 18 });
    camera.position.z = 20;
    const count = 90;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    for (let index = 0; index < count; index += 1) {
      let x = 0, y = 0, z = 0, length = 2;
      while (length > 1 || length === 0) {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        length = x * x + y * y + z * z;
      }
      const radius = Math.cbrt(Math.random());
      positions.set([x * radius, y * radius, z * radius], index * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], index * 4);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
    });
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      uniforms: { uTime: { value: 0 } },
    });
    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height));
      camera.perspective({ aspect: Math.max(1, width) / Math.max(1, height) });
    };
    const pointer = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      mouse.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      mouse.targetY = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("pointermove", pointer, { passive: true });
    resize();

    let frame = 0;
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      const progress = Number(container.closest<HTMLElement>("#hero")?.dataset.diveProgress ?? 0);
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      const orbitProgress = smooth(0.2, diveConfig.cameraNeutral, progress);
      const azimuth = orbitProgress * Math.PI * 2;
      const elevation = Math.sin(orbitProgress * Math.PI) * (16 * Math.PI / 180);
      particles.rotation.x = -elevation + mouse.y * 0.08;
      particles.rotation.y = -azimuth + mouse.x * 0.12;
      particles.rotation.z = Math.sin(azimuth) * 0.08;
      particles.position.x = mouse.x * 1.15 + Math.sin(azimuth) * 0.7;
      particles.position.y = mouse.y * 0.8 + Math.sin(elevation) * 1.6;
      camera.position.x = -mouse.x * 0.75;
      camera.position.y = -mouse.y * 0.5;
      program.uniforms.uTime.value = time * 0.00035 + progress * 5;
      renderer.render({ scene: particles, camera });
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", pointer);
      geometry.remove();
      program.remove();
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={ref} className={styles.particles} data-hero-particles aria-hidden="true" />;
}
