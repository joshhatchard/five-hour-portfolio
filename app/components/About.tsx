"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import WarpImage from "./warp-grid/WarpImage";
import WarpTag from "./warp-grid/WarpTag";
import styles from "./About.module.css";

export default function About({ children }: { children?: ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger, SplitText);
    const copy = grid.querySelectorAll<HTMLElement>(`[data-about-copy]`);
    const split = SplitText.create(copy, {
      type: "lines",
      mask: "lines",
      linesClass: styles.line,
      autoSplit: true,
      onSplit(self) {
        // SplitText's line mask clips to the line box. This display face has
        // deep descenders, so reserve a little space below without changing
        // the visible rhythm between paragraph lines.
        self.lines.forEach((line) => {
          const mask = line.parentElement;
          if (!mask) return;
          mask.style.paddingBottom = "0.1em";
          mask.style.marginBottom = "-0.1em";
        });
        gsap.set(self.lines, { yPercent: 105, autoAlpha: 0 });
        return gsap.to(self.lines, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 58%",
            toggleActions: "play none none reverse",
          },
        });
      },
    });

    return () => split.revert();
  }, []);

  return (
    <section id="about" className={styles.section} aria-label="About me">
      <div ref={gridRef} className={styles.grid} data-about-wipe>
        <div className={styles.portraitColumn}>
          <figure className={styles.portrait}>
            <WarpImage
              src="/about/portrait-placeholder.svg"
              alt="Portrait placeholder — add your photo here"
              width={800}
              height={800}
              className={styles.image}
            />
            <WarpTag className={styles.tag}>About me</WarpTag>
          </figure>
        </div>
        <div className={styles.bio}>
          <p className={styles.intro} data-about-copy>
            I’m a designer and developer exploring <span className={styles.accent}>bold ideas</span> at the edge of what <span className={styles.accent}>AI</span> makes possible.
          </p>
          <p className={styles.background} data-about-copy>
            Driven by curiosity and a love of the unfamiliar, I believe the best work comes from <span className={styles.accent}>stretching what’s known.</span>
          </p>
        </div>
      </div>
      {children && <div className={styles.callToActionMount}>{children}</div>}
    </section>
  );
}
