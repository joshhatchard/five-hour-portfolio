"use client";

import { useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { useHeroDive } from "./hero-dive/useHeroDive";
import styles from "./Hero.module.css";

const headlineFont = Geist({ subsets: ["latin"], variable: "--font-headline" });
const codeFont = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  useHeroDive(heroRef);
  return (
    <section ref={heroRef} id="hero" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.stage} data-hero-stage>
      <div className={styles.fill} data-hero-fill aria-hidden="true" />
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h1 id="hero-heading" className={`${styles.title} ${headlineFont.variable} ${codeFont.variable}`}>
            <span data-hero-copy>IT&apos;S A <strong>NEW ERA</strong> OF</span>
            <span data-hero-copy>
              <strong className={styles.designWord}>DESIGN</strong>{" "}
              <span className={styles.designBadge} aria-hidden="true">✎</span>{" "}
              WITH <strong className={styles.codeWord}>CODE</strong>{" "}
              <span className={styles.codeBadge} aria-hidden="true">&lt;/&gt;</span>
            </span>
            <span><span data-hero-copy>&amp; I&apos;M </span><strong className={styles.highlight} data-hero-send>FULL SEND</strong></span>
          </h1>
          <p className={styles.description} data-hero-copy>
            Designer and developer, turning ideas into thoughtful digital experiences.
          </p>
          <div className={styles.actions} data-hero-copy>
            <a href="#case-studies" className={styles.primary}>See my work <span aria-hidden="true">↓</span></a>
            <a href="#cta" className={styles.secondary}>Say hi</a>
          </div>
        </div>
        <div className={styles.illustration} aria-hidden="true">
          <svg viewBox="0 0 600 480" className={styles.scene} data-hero-world>
            <g data-parallax="0.3"><circle cx="155" cy="140" r="64" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" /></g>
            <g data-parallax="0.5"><path d="M365 100q20-28 42 0q24-22 49 0" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" /></g>
            <g data-parallax="1"><path d="M0 375H460Q530 375 580 411" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" /></g>
            <g className={styles.fallbackFigure}>
            <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M322 215L350 300M332 241L385 229M332 241L382 257M350 300L327 334L340 373M350 300L354 337L378 373" />
            </g>
            <circle cx="314" cy="192" r="25" fill="currentColor" />
            <circle cx="323" cy="190" r="5" fill="#faf9f3" />
            </g>
          </svg>
        </div>
      </div>
      <a href="#case-studies" className={styles.scrollCue} data-hero-copy>Keep scrolling · the work’s down there <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
