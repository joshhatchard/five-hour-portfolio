import { notFound } from "next/navigation";
import CaseStudyLayout from "../_components/CaseStudyLayout";
import { getProject, projects } from "../_content/projects";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <CaseStudyLayout project={project} />;
}
