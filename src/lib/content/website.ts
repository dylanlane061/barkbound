import { type PolicyClaim } from '@pawsignal';
import { extractPolicyClaims } from './extract-llm';

// Website content collection (IO layer). Fetches a place's official site, follows
// a couple of likely pet-policy subpages, strips to text, and extracts pet-policy
// claims. Extraction runs through `extractPolicyClaims`: the Claude-backed
// extractor when ANTHROPIC_API_KEY is set (richer, with a verbatim-quote check),
// falling back to PawSignal's pure regex matcher otherwise. This module only does
// the network + HTML cleanup. Best-effort and defensive — any failure returns
// null so assessment continues without the website signal.

const UA = 'Barkbound/0.1 (+https://barkbound.app; dog-travel-research)';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 800_000; // per page
const MAX_SUBPAGES = 2;
const MAX_TEXT = 60_000; // chars fed to the extractor

// Links worth following — pet policies usually live off the homepage.
const SUBPAGE_HINT = /pet|dog|faq|polic|amenit|rule|accommodat|guest|stay|info/i;

export interface WebsiteDigest {
  url: string; // the resolved site URL
  pagesFetched: string[]; // every page we actually read text from
  claims: PolicyClaim[]; // pet-policy claims found (with quotes)
  textChars: number; // total characters scanned (diagnostics)
}

function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html') && !type.includes('xml')) return null;

    // Cap how much we read so a giant page can't blow up memory.
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    const html = new TextDecoder('utf-8', { fatal: false }).decode(slice);
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|head)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Treat block-ish boundaries as sentence/line breaks so the matcher splits well.
    .replace(/<\/(p|div|li|br|h[1-6]|tr|section|article)\s*>/gi, '.\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function sameOriginSubpages(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const out = new Map<string, string>(); // href -> normalized, dedup by path
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.size < 12) {
    const href = m[1];
    const linkText = m[2].replace(/<[^>]+>/g, ' ');
    try {
      const u = new URL(href, base);
      if (u.origin !== base.origin) continue;
      if (!/^https?:$/.test(u.protocol)) continue;
      const key = u.pathname.toLowerCase().replace(/\/+$/, '');
      if (!key || key === base.pathname.toLowerCase().replace(/\/+$/, '')) continue;
      // Only follow links whose URL or anchor text hints at a policy page.
      if (!SUBPAGE_HINT.test(key) && !SUBPAGE_HINT.test(linkText)) continue;
      u.hash = '';
      if (!out.has(key)) out.set(key, u.toString());
    } catch {
      /* skip malformed href */
    }
  }
  return [...out.values()].slice(0, MAX_SUBPAGES);
}

export async function fetchWebsiteText(rawUrl: string): Promise<WebsiteDigest | null> {
  const start = normalizeUrl(rawUrl);
  if (!start) return null;

  const home = await fetchPage(start);
  if (!home) return null;

  const pages: { url: string; text: string }[] = [
    { url: home.finalUrl, text: htmlToText(home.html) },
  ];

  for (const sub of sameOriginSubpages(home.html, home.finalUrl)) {
    const page = await fetchPage(sub);
    if (page) pages.push({ url: sub, text: htmlToText(page.html) });
  }

  const combined = pages.map((p) => p.text).join('\n').slice(0, MAX_TEXT);
  const claims = await extractPolicyClaims(combined);

  return {
    url: home.finalUrl,
    pagesFetched: pages.map((p) => p.url),
    claims,
    textChars: combined.length,
  };
}
