import type { ReactNode } from "react";
import WarpImage from "./warp-grid/WarpImage";
import styles from "./About.module.css";

export default function About({ children }: { children?: ReactNode }) {
  return (
    <section id="about" className={styles.section} aria-label="About me">
      <div className={styles.grid} data-about-wipe>
        <div className={styles.portraitColumn}>
          <p className={styles.label}>About</p>
          <figure className={styles.portrait}>
            <WarpImage
              src="/about/portrait-placeholder.svg"
              alt="Portrait placeholder — add your photo here"
              width={800}
              height={800}
              className={styles.image}
            />
            <figcaption className={styles.name}>Your name</figcaption>
          </figure>
        </div>
        <div className={styles.bio}>
          {/* Replace these two paragraphs with your introduction and background. */}
          <p className={styles.intro}>
            A little about me, what I do, and what I care about.
          </p>
          <p className={styles.background}>
            A few words about my <span>background</span>, my current focus,
            and the <span>people I’ve worked with</span>.
          </p>
        </div>
      </div>
      {children && <div className={styles.quoteMount}>{children}</div>}
    </section>
  );
}
