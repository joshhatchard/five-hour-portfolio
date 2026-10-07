"use client";

import { useRef, type ReactNode } from "react";
import { Geist } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./RunningHeading.module.css";

const font = Geist({ subsets: ["latin"] });
export type HeadingStep = {
  id: string;
  target: string;
  words: readonly [string, string];
  label: string;
  subtitle: string;
};

type Props = { steps: readonly HeadingStep[]; children: ReactNode };

// The shared title follows scroll in both directions, without locking input.
const TRANSITION_VIEWPORTS = 0.85;
const NEXT_SECTION_LEAD_VIEWPORTS = 0.55;
const COLOUR_TRANSITION_VIEWPORTS = 0.24;
const SECTION_COLOURS = ["#000000", "#faf9f3", "#11120d"];
export default function RunningHeading({ steps, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const first = steps[0];
  const glyphCount = Math.max(...steps.map(step => step.words.join("").length));
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const work = ref.current!;
    const surface = work.querySelector<HTMLElement>("[data-work-surface]")!;
    const heading = work.querySelector<HTMLElement>("[data-work-heading]")!;
    const title = heading.querySelector("h2")!;
    const glyphs = Array.from(title.querySelectorAll<HTMLElement>("[data-glyph]"));
    const subtitle = heading.querySelector("p")!;
    const sections = steps.map(step => work.querySelector<HTMLElement>(step.target)!);
    const aboutWipe = work.querySelector<HTMLElement>("[data-about-wipe]");
    const media = gsap.matchMedia();
    media.add({ reduced: "(prefers-reduced-motion: reduce)", animated: "(prefers-reduced-motion: no-preference)" }, context => {
      const reduced = Boolean(context.conditions?.reduced);
      let timeline: gsap.core.Timeline | undefined;
      let colourTween: gsap.core.Tween | undefined;
      let active = -1;
      let swapAt = 0;
      let starts: number[] = [];
      const setPhrase = (next: number) => {
        const step = steps[next];
        const phrase = step.words.join("");
        glyphs.forEach((glyph, i) => {
          glyph.textContent = phrase[i] ?? "";
          glyph.hidden = i >= phrase.length;
          glyph.toggleAttribute("data-word-start", i === step.words[0].length);
          glyph.toggleAttribute("data-emphasis", i >= step.words[0].length);
        });
        title.dataset.phase = step.id;
        title.setAttribute("aria-label", step.label);
        subtitle.textContent = step.subtitle;
      };
      const build = (index: number) => {
        timeline?.kill();
        colourTween?.kill();
        gsap.set([heading, title, ...glyphs, subtitle], { clearProps: "opacity,visibility,transform,filter" });
        setPhrase(Math.max(0, index - 1));
        timeline = gsap.timeline({ paused: true });
        const from = SECTION_COLOURS[Math.max(0, index - 1)];
        const to = SECTION_COLOURS[index];
        colourTween = gsap.fromTo(surface, { backgroundColor: from }, {
          backgroundColor: to,
          duration: 1,
          ease: "none",
          paused: true,
        });
        swapAt = 0;
        if (reduced) {
          if (index === 0) {
            timeline.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 1 });
            timeline.fromTo(subtitle, { opacity: 0 }, { opacity: 0.65, duration: 1 }, 0);
          } else {
            timeline.to([title, subtitle], { opacity: 0, duration: 0.5 });
            swapAt = 0.5;
            timeline.to(title, { opacity: 1, duration: 0.5 });
            timeline.to(subtitle, { opacity: 0.65, duration: 0.5 }, 0.5);
          }
        } else if (index === 0) {
          const firstWord = glyphs.slice(0, first.words[0].length);
          const secondWord = glyphs.slice(first.words[0].length, first.words.join("").length);
          gsap.set([...glyphs, subtitle], { opacity: 0 });
          timeline.fromTo(firstWord, { yPercent: -160, scaleY: 1.4 }, { yPercent: 0, scaleY: 1, opacity: 1, duration: 0.22, ease: "power4.in" })
            .to(firstWord, { scaleY: 0.8, scaleX: 1.08, duration: 0.07 })
            .to(firstWord, { scaleY: 1, scaleX: 1, duration: 0.09 })
            .fromTo(secondWord, { scaleY: 0.15, scaleX: 1.35 }, { opacity: 1, scaleY: 1.5, scaleX: 0.8, duration: 0.16, stagger: 0.055, ease: "power2.out" }, 0.38)
            .to(secondWord, { scaleY: 1, scaleX: 1, duration: 0.3, stagger: 0.055, ease: "power3.out" }, 0.54)
            .to(subtitle, { opacity: 0.65, duration: 0.25 }, 0.9);
        } else {
          timeline.to(glyphs, { scaleX: 0.08, scaleY: 1.4, opacity: 0, filter: "blur(3px)", duration: 0.28, stagger: 0.02, ease: "power2.in" }, 0.12)
            .to(subtitle, { opacity: 0, duration: 0.2 }, 0.12);
          swapAt = timeline.duration();
          timeline.fromTo(glyphs, { scaleX: 1.4, scaleY: 0.2, opacity: 0, filter: "blur(3px)" }, { scaleX: 1, scaleY: 1, opacity: 1, filter: "blur(0px)", duration: 0.4, stagger: 0.025, ease: "back.out(1.5)", immediateRender: false })
            .to(subtitle, { opacity: 0.65, duration: 0.2 }, "-=0.15");
        }
        active = index;
      };
      const render = () => {
        const scroll = window.scrollY;
        let index = -1;
        starts.forEach((start, i) => { if (scroll >= start) index = i; });
        if (index < 0) {
          gsap.set(heading, { autoAlpha: 0 });
          heading.dataset.state = "before";
          return;
        }
        if (active !== index) build(index);
        const progress = gsap.utils.clamp(0, 1, (scroll - starts[index]) / (window.innerHeight * TRANSITION_VIEWPORTS));
        const colourProgress = index === 0 ? 1 : gsap.utils.clamp(
          0,
          1,
          (scroll - starts[index]) / (window.innerHeight * COLOUR_TRANSITION_VIEWPORTS),
        );
        // Select copy from absolute progress, so fast jumps and reverse seeks
        // always pick the correct words without relying on timeline callbacks.
        timeline!.progress(progress, true);
        colourTween!.progress(colourProgress, true);
        setPhrase(index > 0 && timeline!.time() < swapAt ? index - 1 : index);
        // Let the opaque About card take over the screen instead of allowing
        // the final shared title to remain behind it.
        const wipeProgress = index === steps.length - 1 && aboutWipe
          ? gsap.utils.clamp(0, 1, (scroll - (aboutWipe.getBoundingClientRect().top + scroll - window.innerHeight * 0.7)) / (window.innerHeight * 0.3))
          : 0;
        gsap.set(heading, { autoAlpha: 1 - wipeProgress });
        heading.dataset.state = progress < 1 ? "animating" : steps[index].id;
        heading.dataset.progress = progress.toFixed(3);
      };
      const measure = () => {
        // Ignore the temporary splash translation and begin every title as its
        // section approaches the fold, keeping the sequence consistent.
        starts = sections.map(section => section.getBoundingClientRect().top + window.scrollY
          - new DOMMatrixReadOnly(getComputedStyle(section).transform).m42
          - window.innerHeight * NEXT_SECTION_LEAD_VIEWPORTS);
        render();
      };
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: render,
        onRefresh: measure,
      });
      measure();
      window.addEventListener("scroll", render, { passive: true });
      return () => {
        window.removeEventListener("scroll", render);
        trigger.kill(); timeline?.kill(); colourTween?.kill();
        gsap.set([surface, heading, title, ...glyphs, subtitle], { clearProps: "all" });
      };
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [steps], revertOnUpdate: true });

  return <div ref={ref} className={styles.work}>
    <div className={styles.surface} data-work-surface aria-hidden="true" />
    <div className={`${styles.heading} ${font.className}`} data-work-heading>
      <div className={styles.copy}>
        <h2 aria-label={first.label} data-phase={first.id}>
          {Array.from({ length: glyphCount }, (_, i) => <span
            data-glyph
            data-word-start={i === first.words[0].length ? "" : undefined}
            data-emphasis={i >= first.words[0].length ? "" : undefined}
            aria-hidden="true"
            hidden={i >= first.words.join("").length}
            key={i}
          >{first.words.join("")[i] ?? ""}</span>)}
        </h2>
        <p>{first.subtitle}</p>
      </div>
    </div>
    {children}
  </div>;
}
