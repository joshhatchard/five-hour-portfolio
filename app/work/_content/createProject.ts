import type { CaseStudy } from "./types";

export const createProject = (
  slug: string,
  title: string,
  label: string,
  year: string,
  image: string,
  alt: string,
): CaseStudy => ({
  slug,
  title,
  label,
  year,
  date: year,
  summary: "A modular case study scaffold. Replace this introduction with the project context, your role, and the opportunity you explored.",
  blocks: [
    { type: "copy", id: "context", eyebrow: "Context", heading: "Start with the opportunity.", body: "Use this block for the problem, project scope, collaborators, and constraints. Each project file controls its own content while the page layout stays consistent." },
    {
      type: "media",
      id: "hero-media",
      src: image,
      alt,
      ...(image.startsWith("/creative/") ? { width: 800, height: 600 } : { width: 1600, height: 1000 }),
      caption: "Replace this asset with a project image, video, prototype, or process artefact.",
    },
    { type: "copy", id: "outcome", eyebrow: "Outcome", heading: "Show the work and what changed.", body: "Add more copy, media, or quote blocks in this project’s data file to build the story at the right level of detail." },
  ],
});
