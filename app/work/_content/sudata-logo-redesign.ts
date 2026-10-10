import type { CaseStudy } from "./types";

const sudataLogoRedesign: CaseStudy = {
  slug: "sudata-logo-redesign",
  title: "Logo redesign",
  label: "SUDATA",
  year: "2026",
  date: "April 2026",
  summary: "A refreshed identity for one of the University of Sydney’s largest student communities.",
  blocks: [
    { type: "media", id: "hero", src: "/projects/logo/mock.png", alt: "SUDATA logo redesign", width: 2160, height: 1446 },
    { type: "copy", id: "overview", eyebrow: "Overview", heading: "A mark built for scale.", body: "With more than 800 members, SUDATA had grown into a major student community, but its identity had not kept pace. The new logo brings together the precision of data science, the confidence of a professional organisation and the energy of community." },
    { type: "media", id: "variations", src: "/projects/logo/variations.png", alt: "SUDATA logo variations", width: 1080, height: 1350 },
    { type: "media", id: "colours", src: "/projects/logo/colours.png", alt: "SUDATA colour exploration", width: 1080, height: 1350 },
    { type: "media", id: "screens", src: "/projects/logo/screens.png", alt: "SUDATA screen applications", width: 1080, height: 1350 },
    { type: "media", id: "laptop", src: "/projects/logo/laptop.png", alt: "SUDATA laptop application", width: 1080, height: 1350 },
  ],
};

export default sudataLogoRedesign;
