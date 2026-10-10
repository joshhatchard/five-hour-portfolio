import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import type { CaseStudy } from "../_content/types";
import { CaseStudyBlocks } from "./CaseStudyBlocks";
import ProjectBackButton from "./ProjectBackButton";
import styles from "./CaseStudyLayout.module.css";

export default function CaseStudyLayout({ project }: { project: CaseStudy }) {
  const sections = project.blocks.filter(block => block.type !== "media");
  return (
    <main className={styles.page}>
      <Navbar page="case-study" />

      <div className={styles.layout}>
        <aside className={styles.toc} aria-label="On this page">
          <ProjectBackButton />
          <p>On this page</p>
          <a href="#overview">Overview</a>
          {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.type === "copy" ? section.eyebrow ?? section.heading : "Quote"}</a>)}
        </aside>

        <article className={styles.article}>
          <header id="overview" className={styles.intro}>
            <p className={styles.label}>{project.label}</p>
            <h1>{project.title}</h1>
            <p className={styles.date}>{project.date}</p>
            <div className={styles.rule} />
            <p className={styles.year}>{project.year}</p>
            <p className={styles.summary}>{project.summary}</p>
          </header>
          <CaseStudyBlocks blocks={project.blocks} />
        </article>
      </div>

      <Footer className={styles.footer} backHref="#overview" />
    </main>
  );
}
