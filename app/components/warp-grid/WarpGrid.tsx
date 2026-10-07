"use client";

import { useEffect, useRef } from "react";
import WarpImage from "./WarpImage";
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
          <h3 className="m-0 font-normal">{work.title}</h3>
          <span>{work.tag}</span>
          </figcaption>
        </figure>
      </div>
    </article>
  );
}

export default function WarpGrid({ items }: { items: CreativeWork[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { runtime, motionEnabled } = useScrollRuntime();
  useEffect(() => {
    const cards = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-parallax-card]") ?? []);
    if (!motionEnabled) {
      cards.forEach((card) => { card.style.transform = ""; });
      return;
    }
    const scrollState = runtime.current;
    const speeds = [-0.09, 0.12, -0.06, 0.1, -0.12, 0.07];
    const origins = cards.map((card) => card.getBoundingClientRect().top + window.scrollY);
    const update = () => {
      const scroll = scrollState.scroll + window.innerHeight * 0.5;
      cards.forEach((card, index) => {
        const distance = (scroll - origins[index]) * speeds[index % speeds.length];
        const offset = Math.max(-180, Math.min(180, distance));
        card.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    };
    scrollState.update.add(update);
    update();
    return () => {
      scrollState.update.delete(update);
      cards.forEach((card) => { card.style.transform = ""; });
    };
  }, [motionEnabled, runtime]);
  return (
    <div ref={ref} className={styles.grid}>
      {items.map((work) => <GridItem key={work.src} work={work} />)}
    </div>
  );
}
