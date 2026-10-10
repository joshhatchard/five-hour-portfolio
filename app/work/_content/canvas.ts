import type { CaseStudy } from "./types";

const canvas: CaseStudy = {
  slug: "canvas",
  title: "First Nations support page",
  label: "University of Sydney",
  year: "2025",
  date: "November 2025 · 3 weeks",
  summary: "A Canvas landing page that centralises study resources for First Nations allied health students as part of the University of Sydney’s One Sydney, Many People initiative.",
  blocks: [
    { type: "media", id: "hero", src: "/projects/canvas/hero.png", alt: "University of Sydney First Nations support page", width: 1280, height: 960 },
    { type: "copy", id: "context", eyebrow: "Overview", heading: "A resource hub built from the ground up, for students who deserved better.", body: "I designed and developed this page solo, from information architecture and visual design through to front-end development and academic handoff, under the guidance of a supervising project lead." },
    { type: "media", id: "context-image", src: "/projects/canvas/contextv2.png", alt: "Project context", width: 1280, height: 780 },
    { type: "copy", id: "challenge", eyebrow: "Challenge", heading: "Two constraints, one solution.", body: "Canvas is designed for course delivery, not considered UX: it reformats custom code, collapses layouts and strips styling on save. The work also called for cultural sensitivity without aesthetic tokenism. Both had to be solved together." },
    { type: "media", id: "challenge-image", src: "/projects/canvas/challenge.png", alt: "Canvas platform constraints", width: 1280, height: 834 },
    { type: "copy", id: "discovery", eyebrow: "Discovery", heading: "The brief came from the students themselves.", body: "Yarning sessions with First Nations students showed that resources were scattered and the platform did not feel relevant to them. That feedback became the foundation of every decision." },
    { type: "media", id: "discovery-image", src: "/projects/canvas/discovery.png", alt: "Student yarning session insights", width: 1280, height: 1148 },
    { type: "copy", id: "design", eyebrow: "Design decisions", heading: "Structure shaped by community, not assumption.", body: "The sessions surfaced distinct needs—academic administration, study support, wellbeing, placements and professionalism—so each became its own module. Commissioned artwork grounded the design in cultural identity and helped the space feel like it belonged to its students." },
    { type: "media", id: "design-image", src: "/projects/canvas/decisions.png", alt: "Design decisions and module structure", width: 1280, height: 855 },
    { type: "copy", id: "build", eyebrow: "Build", heading: "Designed and built inside a platform that fights back.", body: "Canvas repeatedly broke custom code on save, requiring careful workarounds to preserve layout and hierarchy. Regular check-ins with my supervisor guided the technical and cultural decisions throughout." },
    { type: "media", id: "build-image", src: "/projects/canvas/constraint.png", alt: "Canvas build constraints", width: 1280, height: 836 },
    { type: "copy", id: "handoff", eyebrow: "Handoff", heading: "Built to outlast my involvement.", body: "Alongside the page, I created a handoff document for academics explaining every custom module, how to edit it safely and how to reuse components without breaking the layout." },
    { type: "media", id: "handoff-image", src: "/projects/canvas/handoff.png", alt: "Handoff documentation", width: 1280, height: 675 },
    { type: "copy", id: "outcome", eyebrow: "Outcome", heading: "A single, trusted place to find what students need.", body: "The completed page consolidated academic calendars, wellbeing resources, placement support and culturally specific contacts into one accessible, considered space." },
    { type: "media", id: "outcome-image", src: "/projects/canvas/outcome1.png", alt: "Completed support page", width: 1280, height: 960 },
  ],
};

export default canvas;
