"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Quote.module.css";
import QuoteModel from "./QuoteModel";
import HeroDotField from "./hero-dive/HeroDotField";
import Footer from "./Footer";

// Replace these placeholders with your own quotes.
const quotes = [
  "Life is too short to get caught up in bad UX.",
  "Let's spend more time living.",
];

// Fill in your destinations here. Unconfigured links stay visibly disabled.
const contactLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/joshhatchard" },
  { label: "GitHub", href: "https://github.com/joshhatchard" },
];

export default function Quote() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(`.${styles.stage}`);
    const actor = section?.querySelector<HTMLElement>("[data-quote-actor]");
    if (!section || !stage || !actor || !window.matchMedia("(pointer: fine)").matches) return;

    const reset = () => {
      stage.style.setProperty("--cta-copy-x", "0px");
      stage.style.setProperty("--cta-copy-y", "0px");
      stage.style.setProperty("--cta-model-x", "0px");
      stage.style.setProperty("--cta-model-y", "0px");
      stage.style.setProperty("--cta-pointer-x", "0");
      stage.style.setProperty("--cta-pointer-y", "0");
    };
    const move = (event: PointerEvent) => {
      if (actor.dataset.interactive !== "true") return;
      const rect = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      stage.style.setProperty("--cta-copy-x", `${x * 8}px`);
      stage.style.setProperty("--cta-copy-y", `${y * 6}px`);
      stage.style.setProperty("--cta-model-x", `${x * 26}px`);
      stage.style.setProperty("--cta-model-y", `${y * 20}px`);
      stage.style.setProperty("--cta-pointer-x", x.toFixed(3));
      stage.style.setProperty("--cta-pointer-y", y.toFixed(3));
    };
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", reset);
    reset();
    return () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", reset);
    };
  }, []);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;
    section.dataset.animated = "true";
    const actor = section.querySelector<HTMLElement>("[data-quote-actor]")!;
    const colour = section.querySelector<HTMLElement>("[data-quote-colour]")!;
    const words = section.querySelectorAll<HTMLElement>("[data-quote-words]");
    const quoteWords = Array.from(words, quote => quote.querySelectorAll<HTMLElement>("[data-quote-word]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cta = section.querySelector<HTMLElement>("[data-quote-cta]")!;
    const ctaWords = section.querySelectorAll<HTMLElement>("[data-cta-word]");
    const ctaHighlight = section.querySelector<HTMLElement>("[data-cta-highlight]")!;
    const spinCaption = section.querySelector<HTMLElement>("[data-spin-caption]")!;
    const primary = getComputedStyle(section).getPropertyValue("--primary").trim();
    const paper = getComputedStyle(section).getPropertyValue("--paper").trim();
    gsap.set(actor, { scale: 1, "--quote-spin": 0, "--quote-flat": 0, "--quote-final": 1, "--quote-idle": 1, rotationZ: 0, y: 0 });
    gsap.set(colour, { autoAlpha: 0 });
    gsap.set(words, { autoAlpha: 0 });
    gsap.set(cta, { autoAlpha: 0, y: 24 });
    gsap.set(ctaWords, { yPercent: reducedMotion ? 0 : 35, autoAlpha: reducedMotion ? 1 : 0 });
    gsap.set(ctaHighlight, { scaleX: reducedMotion ? 1 : 0, transformOrigin: "left" });
    gsap.set(spinCaption, { autoAlpha: 0, y: 8 });
    const entryIdle = 0.65;
    // Extra scroll distance after the last word settles, for reading each quote.
    const readingHold = 0.65;
    const secondQuote = entryIdle + 3.4 + readingHold;
    const returnToCta = entryIdle + 4.4 + readingHold * 2;
    const revealCta = returnToCta + 1.55;
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });
    timeline
      .set(quoteWords.flatMap(group => Array.from(group)), { yPercent: reducedMotion ? 0 : 35, autoAlpha: reducedMotion ? 1 : 0 }, 0)
      .fromTo(actor, { "--quote-idle": 1 }, { "--quote-idle": 0, duration: 0.16, ease: "none", immediateRender: false }, entryIdle)
      .to(actor, { "--quote-spin": 720, rotationZ: 28, duration: 1.5 }, entryIdle)
      .to(actor, { scale: 250, duration: 1.7, ease: "power3.in" }, entryIdle)
      .to(actor, { "--quote-flat": 1, duration: 0.7 }, entryIdle + 0.9)
      .to(colour, { autoAlpha: 1, backgroundColor: primary, duration: 0.4 }, entryIdle + 1.35)
      .to(actor, { "--quote-final": 1, duration: 0.2 }, entryIdle + 1.35)
      .to(actor, { autoAlpha: 0, duration: 0.12 }, entryIdle + 1.72)
      .set(words[0], { autoAlpha: 1 }, entryIdle + 2.05)
      .to(quoteWords[0], { yPercent: 0, autoAlpha: 1, duration: 0.35, stagger: { amount: reducedMotion ? 0 : 0.35 }, ease: "power3.out" }, entryIdle + 2.05)
      .to(words[0], { autoAlpha: 0, y: -32, duration: 0.25 }, entryIdle + 2.9 + readingHold)
      .to(colour, { backgroundColor: primary, duration: 0.3 }, entryIdle + 3.05 + readingHold)
      .set(words[1], { autoAlpha: 1 }, secondQuote)
      .to(quoteWords[1], { yPercent: 0, autoAlpha: 1, duration: 0.35, stagger: { amount: reducedMotion ? 0 : 0.35 }, ease: "power3.out" }, secondQuote)
      .to(words[1], { autoAlpha: 0, y: -32, duration: 0.25 }, secondQuote + 0.85 + readingHold)
      .to(colour, { backgroundColor: paper, duration: 0.3 }, returnToCta)
      .set(actor, { autoAlpha: 1, scale: 250, "--quote-spin": 720, "--quote-flat": 1, "--quote-final": 1, rotationZ: 28, y: 0 }, returnToCta)
      .to(actor, { scale: 1, y: () => -Math.min(window.innerHeight * 0.13, 110), duration: 1.1, ease: "power3.out" }, returnToCta + 0.15)
      // 720° → 1080° is one guaranteed visible turn while returning to the CTA.
      // Reversing this range gives the CTA exit the same complete turn.
      .to(actor, { "--quote-flat": 0, "--quote-spin": 1080, rotationZ: 0, duration: 1.1, ease: "none" }, returnToCta + 0.15)
      .fromTo(actor, { "--quote-idle": 0 }, { "--quote-idle": 1, duration: 0.25, ease: "none", immediateRender: false }, returnToCta + 1.25)
      .to(spinCaption, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, returnToCta + 1.3)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.5 }, returnToCta + 0.95)
      .to(ctaWords, { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: reducedMotion ? 0 : 0.12, ease: "power3.out" }, revealCta)
      .to(ctaHighlight, { scaleX: 1, duration: 0.45, ease: "power3.out" }, revealCta + 0.74);
    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      delete section.dataset.animated;
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="quote" className={styles.section} aria-labelledby="quote-heading">
      <h2 id="quote-heading" className="sr-only">A couple of thoughts</h2>
      <div id="cta" className={styles.ctaAnchor} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.colour} data-quote-colour aria-hidden="true" />
        <HeroDotField />
        <div className={styles.actor} data-quote-actor data-quote-primary="true" aria-hidden="true">
          <QuoteModel />
          <svg viewBox="0 0 160 240" className={styles.stickman}>
            <circle cx="80" cy="36" r="22" fill="currentColor" />
            <path d="M80 71V147M80 92L22 52M80 92L138 52M80 147L30 211M80 147L130 211" fill="none" stroke="currentColor" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <svg viewBox="0 0 260 132" className={styles.spinCaption} data-spin-caption aria-hidden="true">
          <text x="4" y="28">SPIN ME</text>
          <path d="M112 39C134 48 151 66 178 90" />
          <path d="M178 90L165 87M178 90L175 77" />
        </svg>
        {quotes.map(quote => (
          <div key={quote} className={styles.words} data-quote-words>
            <blockquote className={styles.quote}>
              <span className="sr-only">{quote}</span>
              <span aria-hidden="true">
                {quote.split(" ").map((word, index) => (
                  <span key={index}>
                    {index > 0 ? " " : ""}
                    <span className={styles.wordMask}><span data-quote-word>{word}</span></span>
                  </span>
                ))}
              </span>
            </blockquote>
          </div>
        ))}
        <div className={styles.cta} data-quote-cta aria-labelledby="cta-heading">
          <div className={styles.ctaTitle}>
            <h2 id="cta-heading" aria-label="Take that leap">
              <span className={styles.wordMask} aria-hidden="true"><span data-cta-word>TAKE</span></span>{" "}
              <span className={styles.wordMask} aria-hidden="true"><span data-cta-word>THAT</span></span>{" "}
              <span className={styles.wordMask} aria-hidden="true"><strong data-cta-word>LEAP<span className={styles.ctaHighlight} data-cta-highlight /></strong></span>
            </h2>
          </div>
          <nav className={styles.contactLinks} aria-label="Contact links">
            <a href="mailto:joshualhatchard@gmail.com">joshualhatchard@gmail.com</a>
            <div className={styles.socialLinks}>
            {contactLinks.map(({ label, href }) => href ? (
              <a key={label} href={href}>{label}</a>
            ) : (
              <a key={label} aria-disabled="true">{label}</a>
            ))}
            </div>
          </nav>
          <Footer className={styles.footer} />
        </div>
      </div>
    </section>
  );
}
