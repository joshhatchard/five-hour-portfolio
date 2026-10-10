import type { CaseStudy } from "./types";

const sudataMerchandise: CaseStudy = {
  slug: "sudata-merchandise",
  title: "Merchandise",
  label: "SUDATA",
  year: "2026",
  date: "May 2026",
  summary: "A campus merchandise collection that brings a bold, neobrutalist identity to SUDATA apparel.",
  blocks: [
    { type: "media", id: "hero", src: "/projects/merch/hoodie.png", alt: "SUDATA hoodie", width: 5056, height: 3372 },
    { type: "copy", id: "overview", eyebrow: "Overview", heading: "Merch that makes a statement.", body: "Designed to be worn with intent, the SUDATA collection puts the mascot front and centre. A sharp blue and white palette creates pieces that feel bold, unified and unmistakably SUDATA." },
    { type: "media", id: "shirt-front", src: "/projects/merch/shirtfront.jpg", alt: "SUDATA shirt front", width: 2503, height: 2503 },
    { type: "media", id: "shirt-back", src: "/projects/merch/shirtback.jpg", alt: "SUDATA shirt back", width: 2503, height: 2503 },
    { type: "media", id: "hoodie-front", src: "/projects/merch/hoodiefront.jpg", alt: "SUDATA hoodie front", width: 2503, height: 2503 },
    { type: "media", id: "hoodie-back", src: "/projects/merch/hoodieback.jpg", alt: "SUDATA hoodie back", width: 2503, height: 2503 },
  ],
};

export default sudataMerchandise;
