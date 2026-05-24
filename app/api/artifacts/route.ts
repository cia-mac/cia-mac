import { NextResponse } from 'next/server';
import { discoverArtifacts } from '@/lib/artifacts';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const artifacts = await discoverArtifacts();
  return NextResponse.json({ artifacts });
}
