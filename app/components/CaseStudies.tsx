import Splash from "./hero-dive/Splash";
import styles from "./CaseStudies.module.css";

// Replace the artwork and titles with finished case studies when ready.
const caseStudies = [
  { number: "01", title: "Project one", src: "/case-studies/project-one.svg", alt: "Placeholder artwork: an oversized black asterisk on a warm grey background" },
  { number: "02", title: "Project two", src: "/case-studies/project-two.svg", alt: "Placeholder artwork: orange and lilac geometric forms on black" },
  { number: "03", title: "Project three", src: "/case-studies/project-three.svg", alt: "Placeholder artwork: overlapping blue and green interface panels" },
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className={styles.section} aria-label="Case studies">
      <Splash />
      <div className={styles.gallery} data-case-gallery>
        <div className={styles.guides} aria-hidden="true"><i /><i /><i /><i /></div>
        {caseStudies.map((project) => (
          <article key={project.number} className={styles.project} aria-labelledby={`project-${project.number}`}>
            <figure className={styles.figure}>
              <div className={styles.artwork}>
                {/* The image remains in normal document flow, above the opaque hero cover. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.src} alt={project.alt} width={1600} height={1000} className={styles.image} loading="lazy" />
                <span className={styles.tag}>Case study</span>
              </div>
              <figcaption className={styles.caption}>
                <h3 id={`project-${project.number}`}>{project.title}</h3>
                <span className={styles.number}>{project.number} / 03</span>
              </figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}
