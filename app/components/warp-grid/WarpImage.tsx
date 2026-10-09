"use client";

import { useEffect, useId, useRef } from "react";
import { useScrollRuntime } from "./ScrollProvider";

export type WarpImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export default function WarpImage({ src, alt, width, height, className }: WarpImageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const { register } = useScrollRuntime();
  useEffect(() => {
    if (!ref.current) return;
    return register({ id, src, element: ref.current });
  }, [id, src, register]);
  return <span ref={ref} role="img" aria-label={alt} className={className} data-gallery-image
    style={{ display: "block", width: "100%", aspectRatio: `${width} / ${height}`,
      backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" }} />;
}
