import WarpGrid, { type CreativeWork } from "./warp-grid/WarpGrid";
import styles from "./Creative.module.css";

// Add more entries here; the grid creates new rows automatically.
const creativeWork: CreativeWork[] = [
  { title: "Type study", tag: "Typography", src: "/creative/type-study.svg", alt: "Typography placeholder with oversized Aa letterforms" },
  { title: "Shape play", tag: "Experiment", src: "/creative/shape-play.svg", alt: "Green geometric shape placeholder" },
  { title: "Poster series", tag: "Print", src: "/creative/poster-series.svg", alt: "Pink poster placeholder numbered 01" },
  { title: "Small symbols", tag: "Icons", src: "/creative/small-symbols.svg", alt: "Neutral icon placeholder with a star symbol" },
  { title: "Colour study", tag: "Exploration", src: "/creative/colour-study.svg", alt: "Yellow colour study placeholder with a circle" },
  { title: "Motion test", tag: "Motion", src: "/creative/motion-test.svg", alt: "Sage motion placeholder with a directional arrow" },
];

export default function Creative() {
  return (
    <section id="creative" className={styles.section} aria-labelledby="creative-heading">
      <div className={styles.pinnedTitle}>
        <h2 id="creative-heading">Creative</h2>
        <p>Small projects &amp; experiments.</p>
      </div>
      <div className={styles.gallery}>
        <WarpGrid items={creativeWork} />
      </div>
    </section>
  );
}
