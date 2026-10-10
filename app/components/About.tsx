import type { ReactNode } from "react";
import WarpImage from "./warp-grid/WarpImage";
import styles from "./About.module.css";

export default function About({ children }: { children?: ReactNode }) {
  return (
    <section id="about" className={styles.section} aria-label="About me">
      <div className={styles.grid} data-about-wipe>
        <div className={styles.portraitColumn}>
          <figure className={styles.portrait}>
            <WarpImage
              src="/about/portrait-placeholder.svg"
              alt="Portrait placeholder — add your photo here"
              width={800}
              height={800}
              className={styles.image}
            />
            <figcaption className={styles.name}>Hi, I’m Josh :)</figcaption>
          </figure>
        </div>
        <div className={styles.bio}>
          <p className={styles.intro}>
            I’m a designer and developer exploring <span className={styles.accent}>bold ideas</span> at the edge of what <span className={styles.accent}>AI</span> makes possible.
          </p>
          <p className={styles.background}>
            Driven by curiosity and a love of the unfamiliar, I believe the best work comes from <span className={styles.accent}>stretching what’s known</span>.
          </p>
        </div>
      </div>
      {children && <div className={styles.callToActionMount}>{children}</div>}
    </section>
  );
}
