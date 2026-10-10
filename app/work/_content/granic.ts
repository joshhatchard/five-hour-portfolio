import type { CaseStudy } from "./types";

const granic: CaseStudy = {
  slug: "granic",
  title: "Deadline tracker waitlist",
  label: "Granic",
  year: "2025",
  date: "December 2025",
  summary: "A student-focused productivity platform that brings assignment deadlines from LMS platforms into one streamlined workspace.",
  blocks: [
    { type: "media", id: "hero", src: "/projects/granic/hero.png", alt: "Granic deadline tracker landing page", width: 1280, height: 813 },
    { type: "copy", id: "context", eyebrow: "Overview", heading: "Validating the problem before building the product.", body: "Before building the full product, we launched a landing page to test whether students resonated with the problem and were willing to join a waitlist. I led design and frontend alongside co-founder Nathan Townsend." },
    { type: "media", id: "problem-image", src: "/projects/granic/problem.png", alt: "Fragmented deadline tracking across platforms", width: 1280, height: 588 },
    { type: "copy", id: "problem", eyebrow: "Problem", heading: "Students lack a single source of truth for deadlines.", body: "Students constantly switch between Canvas, email and personal calendars just to piece together what is due and when. That mental overhead is a real cost that students should not have to carry." },
    { type: "media", id: "validation-image", src: "/projects/granic/validation.png", alt: "Granic validation approach", width: 1280, height: 835 },
    { type: "copy", id: "validation", eyebrow: "Validation", heading: "Testing whether the idea had demand.", body: "Before writing a line of product code, we wanted to learn whether students felt this problem enough to act on it—and whether they would trust an early-stage product with their email." },
    { type: "media", id: "approach-image", src: "/projects/granic/approachv3.png", alt: "Granic landing-page approach", width: 1920, height: 1233 },
    { type: "copy", id: "approach", eyebrow: "Approach", heading: "Product first, conversion focused.", body: "The page had one job: help a student understand the problem and join the waitlist before leaving. The flow moved from problem to solution to sign-up, removing friction and distractions along the way." },
    { type: "media", id: "design-image", src: "/projects/granic/decisions.png", alt: "Granic visual direction", width: 1280, height: 1076 },
    { type: "copy", id: "design", eyebrow: "Design decisions", heading: "Minimal and distraction free.", body: "A strict black-and-white system kept attention on the idea rather than the interface. Typography carried the hierarchy from headline to supporting copy to CTA." },
    { type: "media", id: "execution-image", src: "/projects/granic/execution.png", alt: "Granic landing page execution", width: 1292, height: 715 },
    { type: "copy", id: "execution", eyebrow: "Execution", heading: "Designed and built end to end.", body: "I designed and developed the landing page using Next.js and Tailwind, with Prisma and Postgres supporting the waitlist database. The stack was chosen to move quickly while remaining straightforward to maintain." },
    { type: "media", id: "outcome-image", src: "/projects/granic/outcome1v2.png", alt: "Granic validation outcome", width: 1920, height: 1359 },
    { type: "copy", id: "outcome", eyebrow: "Outcome", heading: "Early validation in progress.", body: "Each signup is a data point from someone who understood the problem and decided Granic was worth following. The results are informing how we refine and structure the MVP." },
  ],
};

export default granic;
