"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Quote.module.css";
import QuoteModel from "./QuoteModel";
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

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;
    section.dataset.animated = "true";
    const actor = section.querySelector<HTMLElement>("[data-quote-actor]")!;
    const colour = section.querySelector<HTMLElement>("[data-quote-colour]")!;
    const words = section.querySelectorAll<HTMLElement>("[data-quote-words]");
    const cta = section.querySelector<HTMLElement>("[data-quote-cta]")!;
    gsap.set(actor, { scale: 1, "--quote-spin": 0, "--quote-flat": 0, "--quote-final": 0, rotationZ: -12, y: 0 });
    gsap.set(colour, { autoAlpha: 0 });
    gsap.set(words, { autoAlpha: 0, y: 32 });
    gsap.set(cta, { autoAlpha: 0, y: 24 });
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
      .to(actor, { "--quote-spin": 720, rotationZ: 28, duration: 1.5 }, 0)
      .to(actor, { scale: 72, duration: 1.7, ease: "power3.in" }, 0)
      .to(actor, { "--quote-flat": 1, duration: 0.7 }, 0.9)
      .to(colour, { autoAlpha: 1, duration: 0.4 }, 1.45)
      .to(actor, { autoAlpha: 0, duration: 0.4 }, 1.5)
      .to(words[0], { autoAlpha: 1, y: 0, duration: 0.35 }, 2.05)
      .to(words[0], { autoAlpha: 0, y: -32, duration: 0.25 }, 2.9)
      .to(colour, { backgroundColor: "#ffffff", duration: 0.3 }, 3.05)
      .to(words[1], { autoAlpha: 1, y: 0, duration: 0.35 }, 3.4)
      .to(words[1], { autoAlpha: 0, y: -32, duration: 0.25 }, 4.25)
      .to(colour, { backgroundColor: "#ffffff", duration: 0.3 }, 4.4)
      .set(actor, { autoAlpha: 0, scale: 72, "--quote-spin": 720, "--quote-flat": 1, "--quote-final": 1, rotationZ: 28, y: 0 }, 4.4)
      .to(actor, { autoAlpha: 1, scale: 1, y: () => -Math.min(window.innerHeight * 0.13, 110), duration: 1.1, ease: "power3.out" }, 4.55)
      .to(actor, { "--quote-flat": 0, "--quote-spin": 0, rotationZ: -12, duration: 1 }, 4.8)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.5 }, 5.35);
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
        <div className={styles.actor} data-quote-actor aria-hidden="true">
          <QuoteModel />
          <svg viewBox="0 0 160 240" className={styles.stickman}>
            <circle cx="80" cy="36" r="22" fill="currentColor" />
            <path d="M80 71V147M80 92L22 52M80 92L138 52M80 147L30 211M80 147L130 211" fill="none" stroke="currentColor" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {quotes.map((quote, index) => (
          <div key={quote} className={styles.words} data-quote-words>
            <p className={styles.label}>A thought to leave you with · {index + 1} / {quotes.length}</p>
            <blockquote className={styles.quote}>{quote}</blockquote>
          </div>
        ))}
        <div className={styles.cta} data-quote-cta aria-labelledby="cta-heading">
          <div className={styles.ctaTitle}><h2 id="cta-heading">TAKE <strong>THAT LEAP</strong></h2></div>
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
