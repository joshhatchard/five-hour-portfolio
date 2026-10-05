import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h1 id="hero-heading" className={styles.title}>
            <span>I <strong>design,</strong> <span className={styles.designBadge} aria-hidden="true">✎</span></span>
            <span>I code <span className={styles.codeBadge} aria-hidden="true">&lt;/&gt;</span> <strong>and</strong></span>
            <span><strong className={styles.highlight}>send it.</strong></span>
          </h1>
          <p className={styles.description}>
            Designer and developer, turning ideas into thoughtful digital experiences.
          </p>
          <div className={styles.actions}>
            <a href="#case-studies" className={styles.primary}>See my work <span aria-hidden="true">↓</span></a>
            <a href="#cta" className={styles.secondary}>Say hi</a>
          </div>
        </div>
        <div className={styles.illustration} aria-hidden="true">
          <svg viewBox="0 0 600 480" className={styles.scene}>
            <circle cx="155" cy="140" r="64" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" />
            <path d="M365 100q20-28 42 0q24-22 49 0" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
            <path d="M0 375H460Q530 375 580 411" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
            <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M322 215L350 300M332 241L385 229M332 241L382 257M350 300L327 334L340 373M350 300L354 337L378 373" />
            </g>
            <circle cx="314" cy="192" r="25" fill="currentColor" />
            <circle cx="323" cy="190" r="5" fill="#faf9f3" />
          </svg>
        </div>
      </div>
      <a href="#case-studies" className={styles.scrollCue}>Keep scrolling · the work’s down there <span aria-hidden="true">↓</span></a>
    </section>
  );
}
