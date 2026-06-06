// MangaDex API client — all calls are client-side (no server caching of manga content)
const BASE = 'https://api.mangadex.org';

export interface MDChapter {
  id: string;
  attributes: {
    chapter: string | null;
    title: string | null;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
    externalUrl: string | null;
    volume: string | null;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: Record<string, unknown>;
  }>;
}

export interface ChapterFeed {
  result: string;
  data: MDChapter[];
  total: number;
  offset: number;
  limit: number;
}

export interface AtHomeData {
  baseUrl: string;
  hash: string;
  pages: string[];      // full quality
  dataSaver: string[];   // compressed
}

/** Fetch English chapters for a manga, sorted by chapter number */
export async function fetchChapters(
  mangaId: string,
  offset = 0,
  limit = 96
): Promise<ChapterFeed | null> {
  try {
    const url = `${BASE}/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Fetch page image URLs for a specific chapter */
export async function fetchPages(chapterId: string): Promise<AtHomeData | null> {
  try {
    const res = await fetch(`${BASE}/at-home/server/${chapterId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      baseUrl: data.baseUrl,
      hash: data.chapter.hash,
      pages: data.chapter.data,
      dataSaver: data.chapter.dataSaver,
    };
  } catch {
    return null;
  }
}

/** Build full URL for a manga page image */
export function pageUrl(
  baseUrl: string,
  hash: string,
  filename: string,
  quality: 'full' | 'saver' = 'full'
): string {
  const dir = quality === 'saver' ? 'data-saver' : 'data';
  return `${baseUrl}/${dir}/${hash}/${filename}`;
}

/** Get scanlation group name from chapter relationships */
export function getGroupName(ch: MDChapter): string {
  for (const rel of ch.relationships) {
    if (rel.type === 'scanlation_group' && rel.attributes) {
      return (rel.attributes.name as string) || 'Unknown Group';
    }
  }
  return 'Unknown Group';
}

/** Deduplicate chapters — keep one per chapter number (prefer more pages) */
export function dedupeChapters(chapters: MDChapter[]): MDChapter[] {
  const map = new Map<string, MDChapter>();
  for (const ch of chapters) {
    const num = ch.attributes.chapter || '0';
    const existing = map.get(num);
    if (!existing || ch.attributes.pages > existing.attributes.pages) {
      map.set(num, ch);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const na = parseFloat(a.attributes.chapter || '0');
    const nb = parseFloat(b.attributes.chapter || '0');
    return na - nb;
  });
}

/** Extract the real MangaDex manga UUID from a cover image URL.
 *  Cover URLs look like: https://uploads.mangadex.org/covers/{MANGA_UUID}/{filename}
 *  This lets us link DB records (which may have Supabase-generated UUIDs) to MangaDex. */
export function extractMangaDexId(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/covers\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i);
  return match ? match[1] : null;
}
