"use client";

import { useEffect, useId, useRef } from "react";
import { useScrollRuntime } from "./ScrollProvider";

type WarpImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

// Any section can join the existing canvas without creating another scroll loop.
export default function WarpImage({ src, alt, width, height, className }: WarpImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const id = useId();
  const { register } = useScrollRuntime();
  useEffect(() => {
    if (!imageRef.current) return;
    return register({ id, element: imageRef.current, src });
  }, [id, register, src]);

  // The real image owns layout and accessibility, and survives WebGL failure.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imageRef} src={src} alt={alt} width={width} height={height} className={className} />;
}
