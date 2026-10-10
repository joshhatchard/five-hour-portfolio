import Splash from "./hero-dive/Splash";
import WarpHoverMark from "./WarpHoverMark";
import WarpImage from "./warp-grid/WarpImage";
import WarpTag from "./warp-grid/WarpTag";
import { PageTransitionLink } from "./PageTransition";
import styles from "./CaseStudies.module.css";

// Replace the artwork and titles with finished case studies when ready.
const caseStudies = [
  { number: "01", title: "Project one", year: "2025", type: "Case study", href: "/work/project-one", src: "/case-studies/project-one.svg", alt: "Placeholder artwork: an oversized black asterisk on a warm grey background", hoverDirection: 2 as const },
  { number: "02", title: "Project two", year: "2024", type: "Case study", href: "/work/project-two", src: "/case-studies/project-two.svg", alt: "Placeholder artwork: orange and lilac geometric forms on black", hoverDirection: 3 as const },
  { number: "03", title: "Project three", year: "2023", type: "Case study", href: "/work/project-three", src: "/case-studies/project-three.svg", alt: "Placeholder artwork: overlapping blue and green interface panels", hoverDirection: 1 as const },
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className={styles.section} aria-label="Case studies">
      <Splash />
      <div className={styles.content}>
      <div className={styles.gallery} data-case-gallery>
        {caseStudies.map((project) => (
          <article key={project.number} className={styles.project} aria-labelledby={`project-${project.number}`}>
            <PageTransitionLink className={styles.projectLink} href={project.href} rememberPosition data-card-hover-target>
              <figure className={styles.figure}>
                <div className={styles.artwork} data-card-hover-layer>
                  <WarpImage src={project.src} alt={project.alt} width={1600} height={1000} className={styles.image} hoverOverlay hoverDirection={project.hoverDirection} />
                </div>
                <WarpHoverMark direction={project.hoverDirection} />
                <WarpTag className={styles.tag}>{project.type}</WarpTag>
                <figcaption className={styles.caption}>
                  <h3 id={`project-${project.number}`}>{project.title}</h3>
                  <span className={styles.year}>{project.year}</span>
                </figcaption>
              </figure>
            </PageTransitionLink>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
