import type { ReactNode } from "react";
import RunningHeading, { type HeadingStep } from "./RunningHeading";

const headings: readonly HeadingStep[] = [
  { id: "cases", target: "#case-studies", words: ["BIG", "THRILLS"], label: "Big Thrills", subtitle: "Projects & case studies" },
  { id: "creative", target: "#creative", words: ["HIDDEN", "GEMS"], label: "Hidden Gems", subtitle: "Creative work & experiments" },
  { id: "about", target: "#about", words: ["WHO’S", "THIS?"], label: "Who’s this?", subtitle: "About me" },
];

export default function WorkShowcase({ children }: { children: ReactNode }) {
  return <RunningHeading steps={headings}>{children}</RunningHeading>;
}
