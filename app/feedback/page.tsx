import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import StarRating from '@/components/StarRating';
import SubmitButton from '@/components/SubmitButton';
import { getCurrentUser } from '@/lib/auth';
import { listDrops, listFeedback } from '@/lib/queries';
import { submitFeedbackAction } from '@/app/actions/feedback';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.status !== 'approved') redirect('/pending');

  const sp = await searchParams;
  const [drops, feedback] = await Promise.all([listDrops(), listFeedback()]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-sm text-ink/60">Tell me what hit and what to tweak. The kitchen is listening.</p>

        <div className="card mt-5 p-5 sm:p-6">
          <form action={submitFeedbackAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="drop_id">About a drop (optional)</label>
              <select id="drop_id" name="drop_id" className="input">
                <option value="">General feedback</option>
                {drops.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Rating (optional)</span>
              <StarRating />
            </div>
            <div>
              <label className="label" htmlFor="comment">Comment</label>
              <textarea id="comment" name="comment" rows={3} className="input resize-none"
                placeholder="The pesto was unreal. More of that." />
            </div>
            {sp.error === 'empty' && (
              <p className="text-sm text-tomato">Add a comment or a rating first.</p>
            )}
            {sp.ok && (
              <p className="text-sm text-olive">Thanks — got it. 🙏</p>
            )}
            <SubmitButton className="btn-primary" pendingText="Sending…">Send feedback</SubmitButton>
          </form>
        </div>

        <h2 className="mb-3 mt-10 text-lg font-bold tracking-tight text-ink/70">What people are saying</h2>
        {feedback.length === 0 ? (
          <p className="text-sm text-ink/50">No feedback yet. Be the first.</p>
        ) : (
          <ul className="space-y-3">
            {feedback.map((f) => (
              <li key={f.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{f.user_name}</span>
                  {f.rating ? (
                    <span className="text-sm text-tomato">{'★'.repeat(f.rating)}<span className="text-ink/15">{'★'.repeat(5 - f.rating)}</span></span>
                  ) : null}
                </div>
                {f.drop_title && <p className="text-xs text-ink/40">on {f.drop_title}</p>}
                {f.comment && <p className="mt-1 text-sm text-ink/80">{f.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
