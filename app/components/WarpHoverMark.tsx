"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./WarpHoverMark.module.css";
import { useScrollRuntime } from "./warp-grid/ScrollProvider";

export default function WarpHoverMark({ direction }: { direction: 0 | 1 | 2 | 3 }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { runtime } = useScrollRuntime();

  useEffect(() => {
    const mark = ref.current;
    const link = mark?.closest<HTMLElement>("[data-card-hover-target]");
    const image = link?.querySelector<HTMLElement>("[data-gallery-image]");
    if (!mark || !link || !image) return;

    const state = runtime.current;
    let nearViewport = false;
    let dirty = true;
    let previousScroll = NaN;
    let nextCenter = "";
    let currentCenter = "";
    const measure = () => {
      if (!dirty && (!nearViewport || previousScroll === state.scroll)) return;
      dirty = false;
      previousScroll = state.scroll;
      const linkBounds = link.getBoundingClientRect();
      const imageBounds = image.getBoundingClientRect();
      nextCenter = `${(imageBounds.top - linkBounds.top + imageBounds.height / 2).toFixed(2)}px`;
    };
    const commit = () => {
      if (nextCenter === currentCenter) return;
      currentCenter = nextCenter;
      mark.style.setProperty("--mark-center-y", nextCenter);
    };
    const observer = new ResizeObserver(() => { dirty = true; });
    observer.observe(link);
    observer.observe(image);
    const visibility = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
      if (nearViewport) dirty = true;
    }, { rootMargin: "300px" });
    visibility.observe(image);
    state.measure.add(measure);
    state.commit.add(commit);
    return () => {
      observer.disconnect();
      visibility.disconnect();
      state.measure.delete(measure);
      state.commit.delete(commit);
    };
  }, [runtime]);

  return <span ref={ref} className={styles.mark} data-warp-hover-mark data-direction={direction} aria-hidden="true"><Image src="/brand/josh-hatchard-mark.svg" width={332} height={499} alt="" /></span>;
}
