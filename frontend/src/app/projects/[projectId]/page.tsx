import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
        <ProjectDetail projectId={projectId} />
      </main>
    </div>
  );
}
