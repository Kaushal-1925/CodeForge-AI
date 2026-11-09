import { AppHeader } from "@/components/layout/AppHeader";
import { RunDetail } from "@/components/workflows/RunDetail";

interface RunPageProps {
  params: Promise<{ projectId: string; runId: string }>;
}

export default async function RunPage({ params }: RunPageProps) {
  const { projectId, runId } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
        <RunDetail projectId={projectId} runId={runId} />
      </main>
    </div>
  );
}
