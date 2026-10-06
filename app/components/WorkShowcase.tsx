import type { ReactNode } from "react";
import RunningHeading, { type HeadingStep } from "./RunningHeading";

const headings: readonly HeadingStep[] = [
  { id: "cases", target: "#case-studies", words: ["BIG", "THRILLS"], label: "Big Thrills", subtitle: "Selected projects & case studies." },
  { id: "creative", target: "#creative", words: ["HIDDEN", "GEMS"], label: "Hidden Gems", subtitle: "Small projects & experiments." },
  { id: "about", target: "#about", words: ["WHO", "DIS?"], label: "WHO DIS?", subtitle: "A little about me." },
];

export default function WorkShowcase({ children }: { children: ReactNode }) {
  return <RunningHeading steps={headings}>{children}</RunningHeading>;
}
