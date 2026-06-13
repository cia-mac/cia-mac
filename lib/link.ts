/**
 * Lightweight link inspection for the Knowledge Case.
 *
 * Given a URL the user pastes, we try to fetch the page and pull out a title
 * and a chunk of readable text — enough to (a) show a sensible label and
 * (b) feed an embedding so it's searchable by meaning, not just by URL.
 *
 * Everything here is best-effort and never throws: a link that can't be
 * fetched (private, offline, blocks bots) still gets saved, just with the URL
 * as its title and no extracted body.
 */

export type LinkKind = 'video' | 'goal' | 'link';

export type LinkMeta = {
  title: string;
  description: string;
  /** Plain-text body excerpt, stripped of markup. May be empty. */
  text: string;
  kind: LinkKind;
};

const VIDEO_HOSTS = /(?:^|\.)(youtube\.com|youtu\.be|vimeo\.com|loom\.com|tiktok\.com|wistia\.com)$/i;

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Let people paste "youtube.com/..." without the scheme.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function isVideoUrl(url: string): boolean {
  try {
    return VIDEO_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function matchMeta(html: string, names: string[]): string {
  for (const name of names) {
    // Handles both property="og:title" and name="description", attr order agnostic.
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      'i'
    );
    const alt = new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${name}["']`,
      'i'
    );
    const m = html.match(re) || html.match(alt);
    if (m?.[1]) return decodeEntities(m[1]).trim();
  }
  return '';
}

/**
 * Fetches a URL and extracts a title, description and a body excerpt.
 * Always resolves; falls back to the bare URL on any failure.
 */
export async function inspectLink(url: string): Promise<LinkMeta> {
  const kind: LinkKind = isVideoUrl(url) ? 'video' : 'link';
  const fallback: LinkMeta = { title: url, description: '', text: '', kind };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Some sites serve a fuller page to a real-looking browser.
        'User-Agent':
          'Mozilla/5.0 (compatible; StarvingArtistBot/1.0; +https://eats.ciamac.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    }).catch(() => null);
    clearTimeout(timeout);

    if (!res || !res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return fallback;

    // Cap how much we read so a huge page can't blow up memory.
    const raw = (await res.text()).slice(0, 500_000);

    const ogTitle = matchMeta(raw, ['og:title', 'twitter:title']);
    const titleTag = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const title = (ogTitle || (titleTag ? decodeEntities(titleTag).trim() : '') || url).slice(0, 300);

    const description = matchMeta(raw, ['og:description', 'twitter:description', 'description']).slice(0, 1000);

    // Body text after <body>, tags stripped, generously trimmed for embedding.
    const bodyHtml = raw.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)?.[1] ?? raw;
    const text = stripTags(bodyHtml).slice(0, 4000);

    return { title, description, text, kind };
  } catch (err) {
    console.error('[link] inspect failed:', err);
    return fallback;
  }
}
