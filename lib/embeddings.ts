/**
 * Text embeddings for the Knowledge Case.
 *
 * Same philosophy as lib/email.ts and lib/blob.ts: an optional external
 * service that is safe by default.
 *
 *   1. If OPENAI_API_KEY is not set, embed() returns null. The Knowledge Case
 *      still works — search just falls back to plain keyword matching instead
 *      of semantic (natural-language) search.
 *   2. Nothing here throws. A failed embedding must never block saving a link.
 *      Failures are logged and swallowed; the item is stored without a vector.
 *
 * To turn on natural-language search, set in your env vars:
 *   OPENAI_API_KEY      a key from https://platform.openai.com
 *   OPENAI_EMBED_MODEL  optional, defaults to "text-embedding-3-small"
 */

const EMBED_ENDPOINT = 'https://api.openai.com/v1/embeddings';

/** True only when an embeddings provider is configured. */
export function embeddingsEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function embedModel(): string {
  return process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
}

/**
 * Turns text into an embedding vector. Returns null when embeddings are not
 * configured or the request fails — callers must handle the null case.
 */
export async function embed(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const input = text.trim().slice(0, 8000); // keep well under token limits
  if (!input) return null;

  try {
    const res = await fetch(EMBED_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: embedModel(), input }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[embeddings] provider rejected request:', res.status, detail);
      return null;
    }

    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    const vector = data.data?.[0]?.embedding;
    return Array.isArray(vector) ? vector : null;
  } catch (err) {
    console.error('[embeddings] request failed:', err);
    return null;
  }
}

/**
 * Cosine similarity between two equal-length vectors, in [-1, 1]. Higher means
 * more semantically alike. Returns 0 for mismatched or empty vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
