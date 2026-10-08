"use client";

import { useEffect, useRef } from "react";
import { useHeroDive } from "./hero-dive/useHeroDive";
import HeroDotField from "./hero-dive/HeroDotField";
import HeroParticles from "./hero-dive/HeroParticles";
import styles from "./Hero.module.css";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  useHeroDive(heroRef);
  useEffect(() => {
    const hero = heroRef.current;
    const stage = hero?.querySelector<HTMLElement>("[data-hero-stage]");
    if (!hero || !stage || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const render = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      stage.style.setProperty("--hero-copy-x", `${currentX * 9}px`);
      stage.style.setProperty("--hero-copy-y", `${currentY * 7}px`);
      stage.style.setProperty("--hero-scene-x", `${currentX * 20}px`);
      stage.style.setProperty("--hero-scene-y", `${currentY * 15}px`);
      stage.style.setProperty("--hero-scene-rotate-x", `${currentY * -1.2}deg`);
      stage.style.setProperty("--hero-scene-rotate-y", `${currentX * 1.5}deg`);
      hero.style.setProperty("--hero-pointer-x", currentX.toFixed(4));
      hero.style.setProperty("--hero-pointer-y", currentY.toFixed(4));
      frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    };
    const reset = () => { targetX = 0; targetY = 0; };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", reset);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
      hero.style.removeProperty("--hero-pointer-x");
      hero.style.removeProperty("--hero-pointer-y");
    };
  }, []);
  return (
    <section ref={heroRef} id="hero" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.stage} data-hero-stage>
      <HeroDotField />
      <div className={styles.fill} data-hero-fill aria-hidden="true"><HeroParticles /></div>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h1 id="hero-heading" className={styles.title}>
            <span data-hero-copy>IT&apos;S A <strong>NEW ERA</strong> OF</span>
            <span data-hero-copy>
              <strong>DESIGN</strong> WITH <strong>CODE</strong>
            </span>
            <span><span data-hero-copy>&amp; I&apos;M </span><strong className={styles.highlight} data-hero-send>FULL SEND!</strong></span>
          </h1>
          <p className={styles.description} data-hero-copy>
            Designer &amp; Developer (aka design technologist) turning ideas into fully functional digital products.
          </p>
        </div>
        <div className={styles.illustration} aria-hidden="true">
          <svg viewBox="0 0 600 740" className={styles.scene} data-hero-world>
            <defs>
              <clipPath id="hero-left-birds">
                <rect x="-20" y="20" width="270" height="240" />
              </clipPath>
            </defs>
            <g data-parallax="0.5" data-fly-away opacity="0.5" clipPath="url(#hero-left-birds)">
              <image
                href="/hero/birds.png"
                x="-20"
                y="20"
                width="480"
                height="240"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            <g data-parallax="1">
              <image
                href="/hero/boulder-crosshatch.png"
                x="82"
                y="360"
                width="520"
                height="365"
                preserveAspectRatio="xMidYMin meet"
              />
            </g>
            <g className={styles.figureCaption} data-hero-copy>
              <text x="368" y="92">YEP, THAT&apos;S JOSH</text>
              <path d="M414 119C399 127 382 138 365 153" />
              <path d="M365 153L377 149M365 153L371 141" />
            </g>
            <g className={styles.fallbackFigure}>
            <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M322 215L350 300M332 241L385 229M332 241L382 257M350 300L327 334L340 373M350 300L354 337L378 373" />
            </g>
            <circle cx="314" cy="192" r="25" fill="currentColor" />
            <circle cx="323" cy="190" r="5" fill="#ffffff" />
            </g>
          </svg>
        </div>
      </div>
      <p className={styles.scrollHint} data-hero-copy>Scroll to see work <span aria-hidden="true">↓</span></p>
      </div>
    </section>
  );
}
