"use client";

import { useEffect, useId, useRef } from "react";
import { useScrollRuntime } from "./ScrollProvider";

export type WarpImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  hoverOverlay?: boolean;
  hoverDirection?: 0 | 1 | 2 | 3;
};

export default function WarpImage({ src, alt, width, height, className, hoverOverlay = false, hoverDirection = 0 }: WarpImageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const { register } = useScrollRuntime();
  useEffect(() => {
    if (!ref.current) return;
    return register({ id, src, element: ref.current });
  }, [id, src, register]);
  return <span ref={ref} role="img" aria-label={alt} className={className} data-gallery-image data-warp-hover-card={hoverOverlay ? "" : undefined} data-warp-hover-direction={hoverOverlay ? hoverDirection : undefined}
    style={{ display: "block", width: "100%", aspectRatio: `${width} / ${height}`,
      backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" }} />;
}
