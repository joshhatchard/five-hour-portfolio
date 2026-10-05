"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Quote.module.css";

// Replace these placeholders with your own quotes.
const quotes = [
  "Make room for a different perspective.",
  "Stay curious. Keep making.",
];

// Fill in your destinations here. Unconfigured links stay visibly disabled.
const contactLinks = [
  { label: "Email", href: "mailto:joshualhatcchard@gmail.com" },
  { label: "GitHub", href: "" },
  { label: "LinkedIn", href: "" },
];

export default function Quote() {
  const sectionRef = useRef<HTMLElement>(null);

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
    gsap.set(actor, { scale: 1, rotationY: 0, rotationZ: -12, y: 0 });
    gsap.set(colour, { scale: 0 });
    gsap.set(words, { autoAlpha: 0, y: 32 });
    gsap.set(hint, { autoAlpha: 1 });
    gsap.set(cta, { autoAlpha: 0, y: 24 });

    // CTA entrance runs on time, after the scroll-controlled scene finishes.
    const ctaReveal = gsap.to(cta, {
      autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", paused: true,
    });

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });
    timeline
      .to(actor, { rotationY: 720, rotationZ: 28, duration: 0.8 }, 0)
      .to(actor, { scale: 2.5, duration: 0.35, ease: "power1.in" }, 0.08)
      .to(actor, { scale: 24, duration: 0.4, ease: "power2.in" }, 0.43)
      .to(hint, { autoAlpha: 0, duration: 0.1 }, 0.1)
      .to(colour, { scale: 1, duration: 0.34, ease: "power2.inOut" }, 0.46)
      .to(actor, { autoAlpha: 0, duration: 0.08 }, 0.78)
      .to(words[0], { autoAlpha: 1, y: 0, duration: 0.18 }, 0.68)
      // Hold each quote before transitioning to the next beat.
      .to(words[0], { autoAlpha: 0, y: -32, duration: 0.16 }, 1.12)
      .to(words[1], { autoAlpha: 1, y: 0, duration: 0.18 }, 1.28)
      .to(words[1], { autoAlpha: 0, y: -32, duration: 0.16 }, 1.78)
      // The blue figure reappears inside the matching fill, then spins down.
      .to(actor, { autoAlpha: 1, duration: 0.04 }, 1.94)
      .to(colour, { scale: 0, duration: 0.42, ease: "power2.inOut" }, 1.98)
      .to(actor, { scale: 1, rotationY: 1440, rotationZ: 0, y: () => -Math.min(window.innerHeight * 0.2, 160), duration: 0.52, ease: "power2.out" }, 1.98);

    timeline.eventCallback("onComplete", () => ctaReveal.play());
    timeline.eventCallback("onUpdate", () => {
      if (timeline.progress() < 0.99) ctaReveal.pause(0);
    });

    ScrollTrigger.refresh();
    return () => { delete section.dataset.animated; };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="quote" className={styles.section} aria-labelledby="quote-heading">
      <h2 id="quote-heading" className="sr-only">A couple of thoughts</h2>
      <div id="cta" className={styles.ctaAnchor} aria-hidden="true" />
      <div className={styles.stage} data-quote-stage>
        <div className={styles.colour} data-quote-colour aria-hidden="true" />
        <div className={styles.actor} data-quote-actor aria-hidden="true">
          <svg viewBox="0 0 160 240" className={styles.stickman}>
            <circle cx="80" cy="36" r="22" fill="currentColor" />
            <path d="M80 71V147M80 92L32 123M80 92L128 123M80 147L43 211M80 147L117 211" fill="none" stroke="currentColor" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
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
          <h2 id="cta-heading">Let’s make something.</h2>
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
