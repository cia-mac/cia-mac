import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findArtifact } from '@/lib/artifacts';
import { WorkbenchStage } from '@/components/WorkbenchStage';
import { CommandBar } from '@/components/CommandBar';
import { InfoPanel } from '@/components/InfoPanel';

export const dynamic = 'force-dynamic';

export default async function WorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artifact = await findArtifact(id);
  if (!artifact) notFound();

  return (
    <div className="workbench">
      <div className="workbench-meta">
        {artifact.arc} · {artifact.kind} · stage {artifact.stage}
      </div>
      <InfoPanel artifact={artifact} />
      <Link href="/" className="workbench-close" aria-label="Back to grid">
        ← GRID
      </Link>

      <div className="workbench-stage">
        <WorkbenchStage artifact={artifact} />
      </div>

      <CommandBar artifact={artifact} />
    </div>
  );
}
