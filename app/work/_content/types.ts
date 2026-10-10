export type CaseStudyBlock =
  | { type: "copy"; id: string; eyebrow?: string; heading: string; body: string }
  | { type: "media"; id: string; src: string; alt: string; width: number; height: number; caption?: string }
  | { type: "quote"; id: string; quote: string; attribution?: string };

export type CaseStudy = {
  slug: string;
  title: string;
  label: string;
  year: string;
  date: string;
  summary: string;
  blocks: CaseStudyBlock[];
};
