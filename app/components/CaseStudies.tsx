import Splash from "./hero-dive/Splash";
import styles from "./CaseStudies.module.css";

// Replace these placeholders with your projects as they are ready.
const caseStudies = [
  { number: "01", title: "Project one", colour: "#bac9ff" },
  { number: "02", title: "Project two", colour: "#f5b5f5" },
  { number: "03", title: "Project three", colour: "#31c496" },
  { number: "04", title: "Project four", colour: "#ff997f" },
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className={styles.section} aria-labelledby="case-studies-heading">
      <Splash />
      <div className={`container ${styles.heading}`}>
        <h2 id="case-studies-heading">Case Studies</h2>
      </div>
      <div className={styles.stack}>
        {caseStudies.map((project) => (
          <article
            key={project.number}
            className={styles.card}
            style={{ backgroundColor: project.colour }}
            aria-labelledby={`project-${project.number}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.label}>Case study</span>
              <span className={styles.number} aria-hidden="true">{project.number}</span>
              <h3 id={`project-${project.number}`} className={styles.title}>{project.title}</h3>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.description}>
                A short description of the project, your role, and the outcome.
              </p>
              <div className={styles.media}>Project image</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
