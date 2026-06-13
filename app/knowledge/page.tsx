import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import SubmitButton from '@/components/SubmitButton';
import { getCurrentUser } from '@/lib/auth';
import { listKnowledge, searchKnowledge, type KnowledgeItem, type KnowledgeHit } from '@/lib/queries';
import { embeddingsEnabled } from '@/lib/embeddings';
import { addKnowledgeAction, deleteKnowledgeAction } from '@/app/actions/knowledge';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, { icon: string; label: string }> = {
  video: { icon: '🎬', label: 'Video' },
  goal: { icon: '🎯', label: 'Goal' },
  link: { icon: '🔗', label: 'Link' },
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.status !== 'approved') redirect('/pending');

  const sp = await searchParams;
  const query = (sp.q || '').trim();
  const semantic = embeddingsEnabled();

  const results: KnowledgeHit[] = query ? await searchKnowledge(user.id, query) : [];
  const items: KnowledgeItem[] = query ? [] : await listKnowledge(user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Case</h1>
        <p className="text-sm text-ink/60">
          Throw in links — videos, goals, anything worth keeping — and find them later by
          describing what you remember, not the exact words.
        </p>

        {/* Add a link */}
        <div className="card mt-5 p-5 sm:p-6">
          <form action={addKnowledgeAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="url">Paste a link</label>
              <input
                id="url"
                name="url"
                type="text"
                inputMode="url"
                required
                className="input"
                placeholder="https://youtube.com/watch?v=… or any article / goal"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div>
                <label className="label" htmlFor="kind">Type</label>
                <select id="kind" name="kind" className="input" defaultValue="">
                  <option value="">Auto-detect</option>
                  <option value="video">🎬 Video</option>
                  <option value="goal">🎯 Goal</option>
                  <option value="link">🔗 Link</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="note">Note (optional)</label>
                <input id="note" name="note" type="text" className="input"
                  placeholder="why you saved it / what it's about" />
              </div>
            </div>
            {sp.error === 'url' && (
              <p className="text-sm text-tomato">That doesn’t look like a valid link.</p>
            )}
            {sp.ok && (
              <p className="text-sm text-olive">Saved and indexed. 🧠</p>
            )}
            <SubmitButton className="btn-primary" pendingText="Fetching & indexing…">
              Add to case
            </SubmitButton>
          </form>
        </div>

        {/* Search */}
        <form method="get" className="mt-6 flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={query}
            className="input"
            placeholder={semantic ? 'Search by meaning — “clips about staying motivated”' : 'Search your links…'}
          />
          <button type="submit" className="btn-dark shrink-0">Search</button>
        </form>
        <p className="mt-2 text-xs text-ink/40">
          {semantic
            ? 'Natural-language search is on — matches by meaning across everything you saved.'
            : 'Tip: set OPENAI_API_KEY to turn on natural-language (semantic) search. For now this matches keywords.'}
        </p>

        {/* Results or library */}
        {query ? (
          <>
            <h2 className="mb-3 mt-8 text-lg font-bold tracking-tight text-ink/70">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
            </h2>
            <p className="mb-3">
              <Link href="/knowledge" className="text-sm font-semibold text-tomato">← Back to everything</Link>
            </p>
            {results.length === 0 ? (
              <p className="text-sm text-ink/50">Nothing matched. Try describing it differently.</p>
            ) : (
              <ul className="space-y-3">
                {results.map((r) => (
                  <KnowledgeRow key={r.id} item={r} score={r.score} semantic={semantic} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 mt-8 text-lg font-bold tracking-tight text-ink/70">
              Everything in your case ({items.length})
            </h2>
            {items.length === 0 ? (
              <div className="card p-8 text-center text-ink/60">
                <div className="text-4xl">🧠</div>
                <p className="mt-3">Empty for now. Paste your first link above.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((it) => (
                  <KnowledgeRow key={it.id} item={it} semantic={semantic} />
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}

function KnowledgeRow({
  item,
  score,
  semantic,
}: {
  item: KnowledgeItem;
  score?: number;
  semantic: boolean;
}) {
  const k = KIND_LABEL[item.kind] || KIND_LABEL.link;
  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none">{k.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="chip">{k.label}</span>
            <span className="text-xs text-ink/40">{hostOf(item.url)}</span>
            {typeof score === 'number' && semantic && (
              <span className="text-xs text-olive">{Math.round(score * 100)}% match</span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate font-semibold text-ink hover:text-tomato"
          >
            {item.title || item.url}
          </a>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink/60">{item.description}</p>
          )}
          {item.note && <p className="mt-1 text-sm italic text-ink/50">“{item.note}”</p>}
        </div>
        <form action={deleteKnowledgeAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            className="rounded-full px-2 py-1 text-xs text-ink/40 hover:bg-tomato/10 hover:text-tomato"
            title="Remove"
          >
            ✕
          </button>
        </form>
      </div>
    </li>
  );
}
