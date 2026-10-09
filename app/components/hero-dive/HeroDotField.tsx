"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroDotField.module.css";

type Dot = { x: number; y: number; restX: number; restY: number };

export default function HeroDotField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    const canvas = container?.querySelector("canvas");
    if (!container || !canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const mouse = { x: -9999, y: -9999, speed: 0, previousX: -9999, previousY: -9999 };
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(draw); };
    let lastPointer = performance.now();
    const spacing = 18;
    const radius = 1.05;

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      dots = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = column * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;
          dots.push({ x, y, restX: x, restY: y });
        }
      }
      schedule();
    };
    const pointer = (event: PointerEvent) => {
      if (!visible || reducedMotion) return;
      const bounds = container.getBoundingClientRect();
      mouse.x = event.clientX - bounds.left;
      mouse.y = event.clientY - bounds.top;
      const distance = Math.hypot(mouse.x - mouse.previousX, mouse.y - mouse.previousY);
      mouse.speed += (distance - mouse.speed) * 0.45;
      mouse.previousX = mouse.x;
      mouse.previousY = mouse.y;
      lastPointer = performance.now();
      schedule();
    };
    const draw = () => {
      frame = 0;
      if (!visible) return;
      context.clearRect(0, 0, width, height);
      const active = performance.now() - lastPointer < 200;
      const engagement = active ? Math.min(mouse.speed / 5, 1) : 0;
      context.fillStyle = "rgba(17, 18, 13, 0.14)";
      context.beginPath();
      let settling = false;
      for (const dot of dots) {
        const dx = mouse.x - dot.restX;
        const dy = mouse.y - dot.restY;
        const distance = Math.hypot(dx, dy);
        const influence = engagement > 0 && distance < 280 ? (1 - distance / 280) ** 2 * 52 * engagement : 0;
        const targetX = dot.restX - dx / (distance || 1) * influence;
        const targetY = dot.restY - dy / (distance || 1) * influence;
        if (Math.abs(targetX - dot.x) + Math.abs(targetY - dot.y) > 0.05) settling = true;
        dot.x += (targetX - dot.x) * 0.13;
        dot.y += (targetY - dot.y) * 0.13;
        const drawRadius = radius * (1 + influence * 0.025);
        context.moveTo(dot.x + drawRadius, dot.y);
        context.arc(dot.x, dot.y, drawRadius, 0, Math.PI * 2);
      }
      context.fill();
      mouse.speed *= 0.9;
      if (active || settling) schedule();
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    visibility.observe(container);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("pointermove", pointer, { passive: true });
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", pointer);
    };
  }, []);

  return <div ref={ref} className={styles.field} data-hero-dot-field aria-hidden="true"><canvas /></div>;
}
