"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useScrollRuntime } from "./ScrollProvider";

type WarpTagProps = {
  children: string;
  className?: string;
  parallax?: boolean;
};

export default function WarpTag({ children, className, parallax = false }: WarpTagProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const { register } = useScrollRuntime();
  const [src, setSrc] = useState("");
  const label = children.toUpperCase();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const updateTexture = () => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const width = Math.max(1, Math.ceil(bounds.width));
      const height = Math.max(1, Math.ceil(bounds.height));
      const padding = Number.parseFloat(style.paddingLeft) || 0;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = width * density;
      canvas.height = height * density;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(density, density);
      context.fillStyle = "#C4F13A";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#11120D";
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.textBaseline = "middle";
      context.fillText(label, padding, height / 2);
      setSrc(canvas.toDataURL("image/png"));
    };
    updateTexture();
    const observer = new ResizeObserver(updateTexture);
    observer.observe(element);
    document.fonts.ready.then(updateTexture);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!ref.current || !src) return;
    return register({ id, src, element: ref.current, layer: 1 });
  }, [id, register, src]);

  return <span ref={ref} className={className} data-parallax-tag={parallax ? "" : undefined}>{children}</span>;
}
