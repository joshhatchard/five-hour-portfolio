"use client";

import { usePageTransition } from "../../components/PageTransition";

export default function ProjectBackButton() {
  const { goBack } = usePageTransition();
  const handleBack = () => {
    goBack("/");
  };

  return <button className="projectBack" type="button" onClick={handleBack}>← Back</button>;
}
