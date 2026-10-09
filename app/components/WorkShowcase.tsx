"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./WorkShowcase.module.css";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const clampRange = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const mix = (from: number, to: number, amount: number) => Math.round(from + (to - from) * amount);
const colour = (from: readonly number[], to: readonly number[], amount: number) =>
  `rgb(${mix(from[0], to[0], amount)}, ${mix(from[1], to[1], amount)}, ${mix(from[2], to[2], amount)})`;

export default function WorkShowcase({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const work = ref.current;
    const surface = work?.querySelector<HTMLElement>("[data-gallery-surface]");
    const canvas = surface?.querySelector<HTMLCanvasElement>("canvas");
    const creative = work?.querySelector<HTMLElement>("#creative");
    const about = work?.querySelector<HTMLElement>("#about");
    if (!work || !surface || !canvas || !creative || !about) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let previousKey = "";
    const draw = () => {
      frame = 0;
      const width = Math.round(surface.clientWidth);
      const height = Math.round(surface.clientHeight);
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = window.innerHeight;
      const creativeProgress = clamp((viewport * 0.65 - creative.getBoundingClientRect().top) / (viewport * 0.7));
      const aboutProgress = clamp((viewport * 0.65 - about.getBoundingClientRect().top) / (viewport * 0.7));
      const background = aboutProgress > 0
        ? colour([255, 255, 255], [17, 18, 13], aboutProgress)
        : colour([17, 18, 13], [255, 255, 255], creativeProgress);
      const grid = aboutProgress > 0
        ? colour([218, 218, 211], [72, 73, 68], aboutProgress)
        : colour([72, 73, 68], [218, 218, 211], creativeProgress);
      const spacing = clampRange(width * 0.05, 40, 100);
      const key = `${width}:${height}:${density}:${background}:${grid}:${spacing}`;
      if (key === previousKey) return;
      previousKey = key;
      surface.style.backgroundColor = background;
      canvas.width = Math.max(1, Math.round(width * density));
      canvas.height = Math.max(1, Math.round(height * density));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = grid;
      context.globalAlpha = 0.34;
      context.lineWidth = 1;
      for (let y = 0; y <= height; y += spacing) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      for (let x = 0; x <= width; x += spacing) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      context.globalAlpha = 1;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(schedule);
    observer.observe(work);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <div ref={ref} className={styles.work}>
    <div className={styles.surface} data-gallery-surface aria-hidden="true"><canvas /></div>
    {children}
  </div>;
}
