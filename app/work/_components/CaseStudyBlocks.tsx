import Image from "next/image";
import type { CaseStudyBlock } from "../_content/types";
import styles from "./CaseStudyLayout.module.css";

export function CaseStudyBlocks({ blocks }: { blocks: CaseStudyBlock[] }) {
  return blocks.map(block => {
    if (block.type === "media") {
      return (
        <figure id={block.id} key={block.id} className={styles.mediaBlock}>
          <Image src={block.src} alt={block.alt} width={block.width} height={block.height} sizes="(max-width: 700px) 100vw, 64rem" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
    if (block.type === "quote") {
      return (
        <blockquote id={block.id} key={block.id} className={styles.quoteBlock}>
          <p>“{block.quote}”</p>
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      );
    }
    return (
      <section id={block.id} key={block.id} className={styles.copyBlock}>
        {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
        <h2>{block.heading}</h2>
        <p>{block.body}</p>
      </section>
    );
  });
}
