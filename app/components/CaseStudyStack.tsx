"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./CaseStudies.module.css";

export default function CaseStudyStack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const stack = ref.current!;
    const stage = stack.firstElementChild as HTMLElement;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("article"));
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference) and (min-height: 650px)", () => {
      stack.dataset.animated = "true";
      gsap.set(cards, { transformOrigin: "50% 100%" });
      gsap.set(cards.slice(1), { yPercent: 110, rotationX: 0, scale: 1, autoAlpha: 0 });

      // Cards scroll up over the peeling stack, then land and hold. Fully reversible.
      const hold = { progress: 0 };
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: stack,
          start: () => {
            const section = stack.closest("section")!;
            const offset = new DOMMatrixReadOnly(getComputedStyle(section).transform).m42;
            // Measure the resting layout, independent of the hero's splash hold.
            return stack.getBoundingClientRect().top + window.scrollY - offset - parseFloat(getComputedStyle(stage).top);
          },
          end: () => `+=${stack.offsetHeight - stage.offsetHeight}`,
          scrub: 0.18,
          invalidateOnRefresh: true,
        },
      });
      timeline.to(hold, { progress: 1, duration: 0.55 });
      cards.slice(1).forEach((card, index) => {
        const overlap = timeline.duration();
        timeline.set(card, { autoAlpha: 1 }, overlap);
        timeline.to(cards[index], {
          rotationX: -18, rotationZ: index % 2 ? 2 : -2,
          scale: 0.91, yPercent: -4,
          duration: 0.95, ease: "none",
        }, overlap);
        timeline.to(card, {
          yPercent: -1.5, rotationX: 3, rotationZ: index % 2 ? -1.5 : 1.5, scale: 1.025,
          duration: 0.95, ease: "none",
        }, overlap);
        timeline.to(card, {
          yPercent: 1.2, rotationX: 0, rotationZ: index % 2 ? 2 : -2, scale: 1,
          duration: 0.12, ease: "power3.in",
        });
        timeline.to(card, { yPercent: 0, rotationZ: 0, duration: 0.16, ease: "power2.out" });
        timeline.to(hold, { progress: index + 2, duration: 0.65 });
      });
      return () => { delete stack.dataset.animated; };
    });
    return () => media.revert();
  }, { scope: ref });

  return <div ref={ref} className={styles.stack}><div className={styles.cardStage}>{children}</div></div>;
}
