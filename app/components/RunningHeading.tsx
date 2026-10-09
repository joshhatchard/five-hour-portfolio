"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./RunningHeading.module.css";
import { useScrollRuntime } from "./warp-grid/ScrollProvider";

export type HeadingStep = {
  id: string;
  target: string;
  words: readonly [string, string];
  label: string;
  subtitle: string;
};

type Props = { steps: readonly HeadingStep[]; children: ReactNode };

// The first title plays during a brief scroll lock; later titles follow scroll.
const TRANSITION_VIEWPORTS = 0.85;
const NEXT_SECTION_LEAD_VIEWPORTS = 0.55;
const COLOUR_TRANSITION_VIEWPORTS = 0.24;
const SECTION_COLOURS = ["#11120d", "#ffffff", "#11120d"];
const SECTION_GRID_COLOURS = ["rgba(255, 255, 255, 0.075)", "rgba(17, 18, 13, 0.06)", "rgba(255, 255, 255, 0.075)"];
export default function RunningHeading({ steps, children }: Props) {
  const { runtime } = useScrollRuntime();
  const ref = useRef<HTMLDivElement>(null);
  const first = steps[0];
  const glyphCount = Math.max(...steps.map(step => step.words.join("").length));
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const work = ref.current;
    if (!work) return;
    const surface = work.querySelector<HTMLElement>("[data-work-surface]");
    const heading = work.querySelector<HTMLElement>("[data-work-heading]");
    const title = heading?.querySelector("h2");
    if (!surface || !heading || !title) return;
    const glyphs = Array.from(title.querySelectorAll<HTMLElement>("[data-glyph]"));
    const subtitle = heading.querySelector("p")!;
    const sections = steps.map(step => work.querySelector<HTMLElement>(step.target));
    if (sections.some((section) => !section)) return;
    const aboutWipe = work.querySelector<HTMLElement>("[data-about-wipe]");
    const media = gsap.matchMedia();
    media.add({ reduced: "(prefers-reduced-motion: reduce)", animated: "(prefers-reduced-motion: no-preference)" }, context => {
      const reduced = Boolean(context.conditions?.reduced);
      let timeline: gsap.core.Timeline | undefined;
      let introExit: gsap.core.Timeline | undefined;
      let colourTween: gsap.core.Tween | undefined;
      let active = -1;
      let swapAt = 0;
      let starts: number[] = [];
      let alive = true;
      let introDone = false;
      let reverseArmed = false;
      let locked = false;
      let lockedY = 0;
      let resumeLenis = false;
      let nudge: gsap.core.Tween | undefined;
      let nudging = false;
      const gridCanvas = surface.querySelector<HTMLCanvasElement>("[data-work-grid]");
      let gridFrame = 0;
      let gridWidth = 0;
      let gridHeight = 0;
      let lastGridKey = "";
      let phraseIndex = -1;
      const gridPointer = { x: -1000, y: -1000 };
      const cancelNudge = () => {
        nudge?.kill();
        if (nudging) runtime.current.lenis?.scrollTo(window.scrollY, { immediate: true });
        nudging = false;
      };
      let previousScroll = window.scrollY;
      let reverseComplete = false;
      let reverseReleaseY = 0;
      let awaitingExit = false;
      const continueIntro = () => {
        if (!locked || !awaitingExit) return;
        awaitingExit = false;
        delete heading.dataset.awaitingExit;
        introExit?.play(0);
      };
      const preventScroll = (event: Event) => {
        event.preventDefault();
        continueIntro();
      };
      const preventKeyScroll = (event: KeyboardEvent) => {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
          event.preventDefault();
          continueIntro();
        }
      };
      const release = () => {
        locked = false;
        window.removeEventListener("wheel", preventScroll, true);
        window.removeEventListener("touchmove", preventScroll, true);
        window.removeEventListener("keydown", preventKeyScroll, true);
        if (resumeLenis) runtime.current.lenis?.start();
        resumeLenis = false;
        delete heading.dataset.scrollLocked;
      };
      const moveScroll = (y: number) => {
        lockedY = y;
        if (runtime.current.lenis) runtime.current.lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y, behavior: "instant" });
      };
      const resetGridHover = () => {
        gridPointer.x = -1000;
        gridPointer.y = -1000;
      };
      const trackGridHover = (event: PointerEvent) => {
        if (reduced) return;
        const bounds = surface.getBoundingClientRect();
        gridPointer.x = event.clientX - bounds.left;
        gridPointer.y = event.clientY - bounds.top;
      };
      const drawGrid = () => {
        gridFrame = requestAnimationFrame(drawGrid);
        if (!gridCanvas) return;
        const bounds = surface.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
        const width = Math.round(bounds.width);
        const height = Math.round(bounds.height);
        const density = Math.min(window.devicePixelRatio || 1, 2);
        if (width !== gridWidth || height !== gridHeight) {
          gridWidth = width;
          gridHeight = height;
          gridCanvas.width = Math.max(1, width * density);
          gridCanvas.height = Math.max(1, height * density);
          gridCanvas.style.width = `${width}px`;
          gridCanvas.style.height = `${height}px`;
        }
        const context = gridCanvas.getContext("2d");
        if (!context) return;
        const computed = getComputedStyle(surface);
        const colour = computed.getPropertyValue("--grid-colour").trim() || "rgba(255, 255, 255, 0.075)";
        const primary = computed.getPropertyValue("--primary").trim();
        const spacing = gsap.utils.clamp(40, 100, width * 0.05);
        const gridKey = `${width}:${height}:${colour}:${primary}:${Math.floor(gridPointer.x / spacing)}:${Math.floor(gridPointer.y / spacing)}`;
        if (gridKey === lastGridKey) return;
        lastGridKey = gridKey;
        context.setTransform(density, 0, 0, density, 0, 0);
        context.clearRect(0, 0, width, height);
        if (gridPointer.x >= 0 && gridPointer.y >= 0) {
          const cellX = Math.floor(gridPointer.x / spacing) * spacing;
          const cellY = Math.floor(gridPointer.y / spacing) * spacing;
          context.fillStyle = primary || "transparent";
          context.fillRect(cellX, cellY, spacing, spacing);
        }
        context.strokeStyle = colour;
        context.lineWidth = 1;
        for (let y = 0; y <= height + spacing; y += spacing) {
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y);
          context.stroke();
        }
        for (let x = 0; x <= width + spacing; x += spacing) {
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, height);
          context.stroke();
        }
      };
      const setPhrase = (next: number) => {
        if (next === phraseIndex) return;
        phraseIndex = next;
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
        introExit?.kill();
        colourTween?.kill();
        gsap.set([heading, title, ...glyphs, subtitle], { clearProps: "opacity,visibility,transform,filter" });
        setPhrase(Math.max(0, index - 1));
        timeline = gsap.timeline({ paused: true });
        const from = SECTION_COLOURS[Math.max(0, index - 1)];
        const to = SECTION_COLOURS[index];
        const gridFrom = SECTION_GRID_COLOURS[Math.max(0, index - 1)];
        const gridTo = SECTION_GRID_COLOURS[index];
        colourTween = gsap.fromTo(surface, { backgroundColor: from, "--grid-colour": gridFrom }, {
          backgroundColor: to,
          "--grid-colour": gridTo,
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
          timeline
            .fromTo(firstWord, { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.26, ease: "power3.out" })
            .fromTo(secondWord, { xPercent: -70, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.26, ease: "power3.out" }, "+=0.1")
            .to(subtitle, { opacity: 0.65, duration: 0.18 }, "-=0.04");
          introExit = gsap.timeline({ paused: true })
            .to([title, subtitle], { xPercent: -125, opacity: 0, duration: 0.2, ease: "power4.in" });
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
        if (!alive || !work.isConnected || !heading.isConnected || !surface.isConnected) return;
        if (locked) {
          if (Math.abs(window.scrollY - lockedY) > 1) {
            // Scrollbar drags and native scrolling do not emit wheel events.
            // They must also be able to advance the visible title.
            continueIntro();
            moveScroll(lockedY);
          }
          return;
        }
        const scroll = window.scrollY;
        const scrollingBack = scroll < previousScroll - 0.5;
        previousScroll = scroll;
        if (introDone && scroll > starts[0] + 48) reverseArmed = true;
        let index = -1;
        starts.forEach((start, i) => { if (scroll >= start) index = i; });
        // Lenis can cross the exact section boundary in one frame. Keep a
        // small reverse-entry buffer so the title cannot be skipped on the
        // way back toward the hero.
        if (index < 0 && introDone && scrollingBack && scroll >= starts[0] - 160) index = 0;
        // A completed pass stays completed around the boundary, including
        // subpixel layout changes and browser scroll-position rounding.
        if (index < 0 && (introDone || reverseComplete) && scroll >= starts[0] - 2) index = 0;
        if (index < 0) {
          introDone = false;
          reverseArmed = false;
          reverseComplete = false;
          cancelNudge();
          gsap.set(heading, { autoAlpha: 0 });
          heading.dataset.state = "before";
          return;
        }
        if (active !== index) build(index);
        if (index === 0 && !reduced) {
          colourTween!.progress(1, true);
          if (reverseComplete) {
            // Leave room to travel toward the hero without immediately relocking.
            if (scroll <= reverseReleaseY + 32) {
              gsap.set(heading, { autoAlpha: 0 });
              return;
            }
            reverseComplete = false;
            introDone = false;
          }
          const reverse = introDone && reverseArmed && scrollingBack && scroll <= starts[0] + 8;
          if (!reverse && (introDone || scroll > starts[0] + window.innerHeight)) {
            introDone = true;
            timeline!.progress(1, true);
            gsap.set(heading, { autoAlpha: 0 });
            return;
          }
          cancelNudge();
          locked = true;
          heading.dataset.scrollLocked = "true";
          resumeLenis = Boolean(runtime.current.lenis && !runtime.current.lenis.isStopped);
          runtime.current.lenis?.stop();
          window.addEventListener("wheel", preventScroll, { passive: false, capture: true });
          window.addEventListener("touchmove", preventScroll, { passive: false, capture: true });
          window.addEventListener("keydown", preventKeyScroll, true);
          // Both directions pause at the same point: the moment Big Thrills
          // reaches the top of the viewport.
          moveScroll(starts[0]);
          gsap.set(heading, { autoAlpha: 1 });
          timeline!.eventCallback("onComplete", null);
          timeline!.eventCallback("onReverseComplete", null);
          if (reverse) {
            reverseArmed = false;
            awaitingExit = false;
            introExit!.eventCallback("onReverseComplete", () => {
              timeline!.eventCallback("onReverseComplete", () => {
                reverseComplete = true;
                reverseReleaseY = window.scrollY;
                previousScroll = window.scrollY;
                gsap.set(heading, { autoAlpha: 0 });
                release();
              });
              timeline!.progress(1, true).reverse();
            });
            introExit!.progress(1, true).reverse();
            return;
          }
          timeline!.eventCallback("onComplete", () => {
            awaitingExit = true;
            heading.dataset.awaitingExit = "true";
          });
          introExit!.eventCallback("onComplete", () => {
            awaitingExit = false;
            delete heading.dataset.awaitingExit;
            introDone = true;
            previousScroll = window.scrollY;
            release();
            // Only help a resting viewer: fresh input cancels this small nudge.
            nudge = gsap.delayedCall(0.25, () => {
              if (!runtime.current.lenis) return;
              const distance = window.innerHeight / 3;
              nudging = true;
              runtime.current.lenis.scrollTo(window.scrollY + distance, {
                duration: 0.65,
                lerp: 0,
                easing: t => 1 - (1 - t) ** 3,
                onComplete: () => { nudging = false; },
              });
            });
            render();
          });
          timeline!.play(0);
          return;
        }
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
        const wipeProgress = index === steps.length - 1 && aboutWipe?.isConnected
          ? gsap.utils.clamp(0, 1, (scroll - (aboutWipe.getBoundingClientRect().top + scroll - window.innerHeight * 0.7)) / (window.innerHeight * 0.3))
          : 0;
        gsap.set(heading, { autoAlpha: 1 - wipeProgress });
        heading.dataset.state = progress < 1 ? "animating" : steps[index].id;
        heading.dataset.progress = progress.toFixed(3);
      };
      const measure = () => {
        if (!alive || !work.isConnected) return;
        // Ignore the temporary splash translation and begin every title as its
        // section approaches the fold, keeping the sequence consistent.
        starts = sections.map((section, index) => section!.getBoundingClientRect().top + window.scrollY
          - new DOMMatrixReadOnly(getComputedStyle(section!).transform).m42
          - window.innerHeight * (index === 0 ? 0 : NEXT_SECTION_LEAD_VIEWPORTS));
        // Native scroll positions may use whole pixels; never lock just above
        // the fractional boundary and accidentally reset the completed pass.
        starts[0] = Math.ceil(starts[0]);
        render();
      };
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: render,
        onRefresh: measure,
      });
      measure();
      window.addEventListener("wheel", cancelNudge, { capture: true, passive: true });
      window.addEventListener("touchstart", cancelNudge, { capture: true, passive: true });
      window.addEventListener("keydown", cancelNudge, true);
      window.addEventListener("scroll", render, { passive: true });
      window.addEventListener("pointermove", trackGridHover, { passive: true });
      window.addEventListener("pointerleave", resetGridHover);
      gridFrame = requestAnimationFrame(drawGrid);
      return () => {
        alive = false;
        cancelNudge();
        window.removeEventListener("wheel", cancelNudge, true);
        window.removeEventListener("touchstart", cancelNudge, true);
        window.removeEventListener("keydown", cancelNudge, true);
        window.removeEventListener("scroll", render);
        window.removeEventListener("pointermove", trackGridHover);
        window.removeEventListener("pointerleave", resetGridHover);
        cancelAnimationFrame(gridFrame);
        release();
        trigger.kill(); timeline?.kill(); introExit?.kill(); colourTween?.kill();
        if (surface.isConnected && heading.isConnected) {
          gsap.set([surface, heading, title, ...glyphs, subtitle], { clearProps: "all" });
        }
      };
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [steps], revertOnUpdate: true });

  return <div ref={ref} className={styles.work}>
    <div className={styles.surface} data-work-surface aria-hidden="true"><canvas className={styles.gridCanvas} data-work-grid /></div>
    <div className={styles.heading} data-work-heading>
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
