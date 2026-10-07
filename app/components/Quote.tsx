"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Quote.module.css";
import QuoteModel from "./QuoteModel";
import { useScrollRuntime } from "./warp-grid/ScrollProvider";

// Replace these placeholders with your own quotes.
const quotes = [
  "Life is too short to get caught up in bad UX.",
  "Let's spend more time living.",
];

// Fill in your destinations here. Unconfigured links stay visibly disabled.
const contactLinks = [
  { label: "Email", href: "mailto:joshualhatcchard@gmail.com" },
  { label: "GitHub", href: "" },
  { label: "LinkedIn", href: "" },
];

export default function Quote() {
  const sectionRef = useRef<HTMLElement>(null);
  const { runtime } = useScrollRuntime();

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const section = sectionRef.current;
    if (!section) return;
    section.dataset.animated = "true";
    const actor = section.querySelector('[data-quote-actor]');
    const colour = section.querySelector('[data-quote-colour]');
    const words = section.querySelectorAll('[data-quote-words]');
    const cta = section.querySelector('[data-quote-cta]');
    const hint = section.querySelector('[data-quote-hint]');
    gsap.set(actor, { scale: 1, "--quote-spin": 0, "--quote-flat": 0, "--quote-final": 0, rotationZ: -12, y: 0 });
    gsap.set(colour, { autoAlpha: 0 });
    gsap.set(words, { autoAlpha: 0, y: 32 });
    gsap.set(hint, { autoAlpha: 1 });
    gsap.set(cta, { autoAlpha: 0, y: 24 });
    let inputLocked = false;
    const blockScrollInput = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const blockScrollKeys = (event: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const lockScroll = () => {
      const lenis = runtime.current.lenis;
      lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      lenis?.stop();
      if (inputLocked) return;
      inputLocked = true;
      window.addEventListener("wheel", blockScrollInput, { passive: false, capture: true });
      window.addEventListener("touchmove", blockScrollInput, { passive: false, capture: true });
      window.addEventListener("keydown", blockScrollKeys, { capture: true });
    };
    const releaseScroll = () => {
      runtime.current.lenis?.start();
      if (!inputLocked) return;
      inputLocked = false;
      window.removeEventListener("wheel", blockScrollInput, true);
      window.removeEventListener("touchmove", blockScrollInput, true);
      window.removeEventListener("keydown", blockScrollKeys, true);
    };
    let forcedTransition: "intro" | "outro" | null = null;
    let entryPlayed = false;
    let outroPlayed = false;
    const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;
    const freezeScrollAt = (position: number) => {
      const lenis = runtime.current.lenis;
      if (lenis) {
        lenis.scrollTo(position, { immediate: true, force: true });
      } else {
        window.scrollTo(0, position);
      }
      ScrollTrigger.update();
      lockScroll();
    };

    const intro = gsap.timeline({ defaults: { ease: "none" }, paused: true });
    intro
      .to(actor, { "--quote-spin": 720, rotationZ: 28, duration: 0.8 }, 0)
      .to(actor, { scale: 2.5, duration: 0.35, ease: "power1.in" }, 0.08)
      .to(actor, { scale: 72, duration: 0.28, ease: "power2.in" }, 0.4)
      .to(actor, { "--quote-flat": 1, duration: 0.12, ease: "none" }, 0.56)
      .to(hint, { autoAlpha: 0, duration: 0.1 }, 0.1)
      .set(colour, { autoAlpha: 1 }, 0.68)
      .set(actor, { autoAlpha: 0 }, 0.7);
    intro.timeScale(0.65);
    intro.eventCallback("onComplete", () => {
      // Keep the copy at its first frame until the forced entry has finished.
      // The visitor then starts its scrub from an actual progress of zero.
      delete section.dataset.quoteCopyLocked;
      textTimeline.progress(0);
      textTrigger?.enable(false, false);
      textTrigger?.refresh();
      forcedTransition = null;
      releaseScroll();
    });
    intro.eventCallback("onReverseComplete", () => {
      forcedTransition = null;
      entryPlayed = false;
      releaseScroll();
    });

    const reverseIntro = () => {
      if (forcedTransition === "intro" || intro.progress() === 0) return;
      forcedTransition = "intro";
      section.dataset.quoteCopyLocked = "true";
      textTrigger?.getTween()?.kill();
      textTrigger?.disable(false, false);
      textTimeline.progress(0);
      gsap.set(words, { autoAlpha: 0, y: 32 });
      // A fast Lenis gesture can have a target beyond this trigger. Park the
      // document at the real zero frame before running the reverse timeline.
      freezeScrollAt(sectionTop());
      intro.reverse();
    };

    const textTimeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: () => section.getBoundingClientRect().top + window.scrollY + window.innerHeight,
        end: () => section.getBoundingClientRect().top + window.scrollY + section.offsetHeight - window.innerHeight,
        scrub: 0.55,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          gsap.set(words, { autoAlpha: 0, y: 32 });
          gsap.set(colour, { backgroundColor: "#d5fa48" });
          // Start the forced exit as soon as the text range is left, rather
          // than making the visitor scroll another viewport to reach it.
          reverseIntro();
        },
        onLeave: () => gsap.set(words, { autoAlpha: 0 }),
      },
    });
    const textTrigger = textTimeline.scrollTrigger;
    textTimeline
      .set(words[0], { autoAlpha: 1, y: 32 }, 0.12)
      .to(words[0], { y: 0, duration: 0.24 }, 0.12)
      .set(words[0], { autoAlpha: 0, y: -32 }, 0.82)
      .set(colour, { backgroundColor: "#faf9f3" }, 0.94)
      .set(words[1], { autoAlpha: 1, y: 32 }, 1.05)
      .to(words[1], { y: 0, duration: 0.24 }, 1.05)
      .set(words[1], { autoAlpha: 0, y: -32 }, 1.75);

    const outro = gsap.timeline({ defaults: { ease: "none" }, paused: true });
    outro
      .set(colour, { backgroundColor: "#d5fa48", autoAlpha: 1 }, 0)
      .set(actor, { autoAlpha: 1, scale: 72, "--quote-spin": 720, "--quote-flat": 1, "--quote-final": 1, rotationZ: 28, y: 0 }, 0)
      .to(actor, { scale: 2.5, duration: 0.28, ease: "power2.out" }, 0)
      .to(actor, { "--quote-flat": 0, duration: 0.12 }, 0)
      .to(actor, { scale: 1, y: () => -Math.min(window.innerHeight * 0.2, 160), duration: 0.35, ease: "power1.out" }, 0.28)
      .to(actor, { "--quote-spin": 0, rotationZ: -12, duration: 0.8 }, 0);
    outro.timeScale(0.65);
    const ctaReveal = gsap.to(cta, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", paused: true });
    outro.eventCallback("onComplete", () => ctaReveal.restart());
    outro.eventCallback("onReverseComplete", () => {
      delete section.dataset.quoteCopyLocked;
      textTrigger?.enable(false, false);
      textTrigger?.refresh();
      forcedTransition = null;
      outroPlayed = false;
      releaseScroll();
    });
    ctaReveal.eventCallback("onComplete", () => {
      forcedTransition = null;
      releaseScroll();
    });
    const playOutro = () => {
      if (forcedTransition === "outro" || outroPlayed) return;
      outroPlayed = true;
      forcedTransition = "outro";
      section.dataset.quoteCopyLocked = "true";
      textTrigger?.getTween()?.kill();
      textTrigger?.disable(false, false);
      intro.progress(1).pause();
      gsap.set(words, { autoAlpha: 0 });
      freezeScrollAt(textTrigger?.end ?? sectionTop() + section.offsetHeight - window.innerHeight);
      outro.restart();
    };
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => section.getBoundingClientRect().top + window.scrollY + section.offsetHeight - window.innerHeight,
      invalidateOnRefresh: true,
      onEnter: () => {
        if (forcedTransition === "intro" || entryPlayed) return;
        entryPlayed = true;
        forcedTransition = "intro";
        section.dataset.quoteCopyLocked = "true";
        textTrigger?.getTween()?.kill();
        textTrigger?.disable(false, false);
        textTimeline.progress(0);
        outro.pause(0); ctaReveal.pause(0);
        gsap.set(words, { autoAlpha: 0, y: 32 });
        freezeScrollAt(sectionTop());
        intro.restart();
      },
      onLeave: playOutro,
      onEnterBack: () => {
        if (forcedTransition === "outro" || !outroPlayed) return;
        forcedTransition = "outro";
        section.dataset.quoteCopyLocked = "true";
        textTrigger?.getTween()?.kill();
        ctaReveal.reverse();
        freezeScrollAt(textTrigger?.end ?? sectionTop() + section.offsetHeight - window.innerHeight);
        outro.reverse();
      },
      onLeaveBack: () => {
        if (entryPlayed) reverseIntro();
      },
    });

    ScrollTrigger.refresh();
    return () => {
      trigger.kill(); ctaReveal.kill(); intro.kill(); textTimeline.kill(); outro.kill();
      releaseScroll();
      delete section.dataset.animated;
      delete section.dataset.quoteCopyLocked;
    };
  }, { scope: sectionRef, dependencies: [runtime] });

  return (
    <section ref={sectionRef} id="quote" className={styles.section} aria-labelledby="quote-heading">
      <h2 id="quote-heading" className="sr-only">A couple of thoughts</h2>
      <div id="cta" className={styles.ctaAnchor} aria-hidden="true" />
      <div className={styles.stage} data-quote-stage>
        <div className={styles.colour} data-quote-colour aria-hidden="true" />
        <div className={styles.actor} data-quote-actor aria-hidden="true">
          <QuoteModel />
          <svg viewBox="0 0 160 240" className={styles.stickman}>
            <circle cx="80" cy="36" r="22" fill="currentColor" />
            <path d="M80 71V147M80 92L22 52M80 92L138 52M80 147L30 211M80 147L130 211" fill="none" stroke="currentColor" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className={styles.hint} data-quote-hint aria-hidden="true">A change of perspective ↓</p>
        {quotes.map((quote, index) => (
          <div key={quote} className={styles.words} data-quote-words>
            <p className={styles.label}>A thought to leave you with · {index + 1} / {quotes.length}</p>
            <blockquote className={styles.quote}>{quote}</blockquote>
          </div>
        ))}
        <div className={styles.cta} data-quote-cta aria-labelledby="cta-heading">
          <h2 id="cta-heading">TAKE THAT LEAP</h2>
          <nav className={styles.contactLinks} aria-label="Contact links">
            {contactLinks.map(({ label, href }) => href ? (
              <a key={label} href={href}>{label}</a>
            ) : (
              <a key={label} aria-disabled="true">{label}</a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
