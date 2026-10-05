"use client";

import WarpImage from "./WarpImage";

export type CreativeWork = { title: string; tag: string; src: string; alt: string };

function GridItem({ work }: { work: CreativeWork }) {
  return (
    <article className="relative min-w-0 border-r border-b border-[#dddcd5] px-3 py-8 md:px-10 md:py-20">
      <span aria-hidden="true" className="absolute -left-1.5 -top-3 text-sm text-[#b6b5ae]">+</span>
      <figure className="relative z-[1] m-0">
        <WarpImage src={work.src} alt={work.alt} width={800} height={600} className="block aspect-[4/3] w-full object-cover" />
        <figcaption className="mt-3 flex flex-col gap-1 break-words font-mono text-[10px] uppercase md:flex-row md:justify-between md:gap-4 md:text-xs">
          <h3 className="m-0 font-normal">{work.title}</h3>
          <span>{work.tag}</span>
        </figcaption>
      </figure>
    </article>
  );
}

export default function WarpGrid({ items }: { items: CreativeWork[] }) {
  return (
    <div className="relative z-[1] grid grid-cols-2 border-t border-l border-[#dddcd5] md:grid-cols-3">
      {items.map((work) => <GridItem key={work.src} work={work} />)}
    </div>
  );
}
