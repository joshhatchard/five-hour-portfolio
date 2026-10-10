import WarpGrid, { type CreativeWork } from "./warp-grid/WarpGrid";
import styles from "./Creative.module.css";

// Add more entries here; the grid creates new rows automatically.
const creativeWork: CreativeWork[] = [
  { title: "SUDATA merchandise", tag: "Graphic + product design", href: "/work/sudata-merchandise", src: "/projects/merch/thumbnail.jpg", alt: "SUDATA merchandise preview" },
  { title: "SUDATA logo redesign", tag: "Branding", href: "/work/sudata-logo-redesign", src: "/projects/logo/thumbnail.jpg", alt: "SUDATA logo redesign preview" },
  { title: "Poster series", tag: "Print", href: "/work/poster-series", src: "/creative/poster-series.svg", alt: "Pink poster placeholder numbered 01" },
  { title: "Small symbols", tag: "Icons", href: "/work/small-symbols", src: "/creative/small-symbols.svg", alt: "Neutral icon placeholder with a star symbol" },
  { title: "Colour study", tag: "Exploration", href: "/work/colour-study", src: "/creative/colour-study.svg", alt: "Yellow colour study placeholder with a circle" },
];

export default function Creative() {
  return (
    <section id="creative" className={styles.section} aria-label="Creative work">
      <div className={styles.gallery}>
        <WarpGrid items={creativeWork} />
      </div>
    </section>
  );
}
