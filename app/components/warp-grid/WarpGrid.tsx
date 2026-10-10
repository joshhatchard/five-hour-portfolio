"use client";

import { useEffect, useRef } from "react";
import WarpImage from "./WarpImage";
import WarpTag from "./WarpTag";
import { useScrollRuntime } from "./ScrollProvider";
import styles from "./WarpGrid.module.css";

export type CreativeWork = { title: string; tag: string; src: string; alt: string };

function GridItem({ work }: { work: CreativeWork }) {
  return (
    <article className={styles.item}>
      <div className={styles.card} data-parallax-card>
        <figure className={styles.figure}>
          <WarpImage src={work.src} alt={work.alt} width={800} height={600} className={styles.image} />
          <figcaption className={styles.caption}>
            <h3>{work.title}</h3>
          </figcaption>
        </figure>
      </div>
      <WarpTag className={styles.tag} parallax>{work.tag}</WarpTag>
    </article>
  );
}

export default function WarpGrid({ items }: { items: CreativeWork[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { runtime, motionEnabled } = useScrollRuntime();
  useEffect(() => {
    const cards = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-parallax-card]") ?? []);
    const tags = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-parallax-tag]") ?? []);
    const compactLayout = window.matchMedia("(max-width: 700px)").matches;
    if (!motionEnabled || compactLayout) {
      cards.forEach((card) => { card.style.transform = ""; });
      tags.forEach((tag) => { tag.style.transform = ""; });
      return;
    }
    const scrollState = runtime.current;
    const speeds = [-0.012, 0.016, -0.01, 0.014, -0.016];
    const maxOffset = 24;
    let origins: number[] = [];
    const measure = () => {
      origins = cards.map(card => card.getBoundingClientRect().top + window.scrollY
        - new DOMMatrixReadOnly(getComputedStyle(card).transform).m42);
    };
    const update = () => {
      const scroll = scrollState.scroll + window.innerHeight * 0.5;
      cards.forEach((card, index) => {
        const distance = (scroll - origins[index]) * speeds[index % speeds.length];
        const offset = Math.max(-maxOffset, Math.min(maxOffset, distance));
        card.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
        tags[index]?.style.setProperty("transform", `translate3d(0, ${offset.toFixed(2)}px, 0)`);
      });
    };
    measure();
    scrollState.refresh.add(measure);
    scrollState.update.add(update);
    update();
    return () => {
      scrollState.update.delete(update);
      scrollState.refresh.delete(measure);
      cards.forEach((card) => { card.style.transform = ""; });
      tags.forEach((tag) => { tag.style.transform = ""; });
    };
  }, [motionEnabled, runtime]);
  return (
    <div ref={ref} className={styles.grid}>
      {items.map((work) => <GridItem key={work.src} work={work} />)}
    </div>
  );
}
