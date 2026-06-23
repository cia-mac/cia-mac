import { requireAdmin } from '@/lib/auth';
import { WORKBENCH_HTML } from './content';

// Private tool: the @ciamac YouTube copy workbench. Served only to an approved
// admin (i.e. the owner). Not in public/ on purpose — static files there are
// world-readable; this route gates on the portal session before returning HTML.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.redirect(new URL('/login', req.url), 302);
  }
  return new Response(WORKBENCH_HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Keep it out of shared caches / search engines.
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
