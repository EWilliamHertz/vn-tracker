// MangaDex utilities — all API calls go through our server proxy to avoid CORS/hotlink issues

/** Extract the real MangaDex manga UUID from a cover image URL */
export function extractMangaDexId(imageUrl: string, fallbackId: string): string {
  if (imageUrl && imageUrl.includes('covers/')) {
    const parts = imageUrl.split('covers/');
    if (parts.length > 1) {
      const uuid = parts[1].split('/')[0];
      if (uuid && uuid.length === 36) return uuid;
    }
  }
  return fallbackId;
}

/** Get a proxied cover image URL to avoid MangaDex hotlink blocking */
export function getCoverUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  if (imageUrl.includes('mangadex.org')) {
    return `/api/manga?action=cover&url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

/** Fetch chapters for a manga via our server proxy */
export async function fetchChapters(mangaDexId: string, offset = 0, limit = 100) {
  const res = await fetch(`/api/manga?action=chapters&mangadexId=${mangaDexId}&offset=${offset}&limit=${limit}`);
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

/** Fetch page image URLs for a chapter via our server proxy */
export async function fetchChapterPages(chapterId: string): Promise<{ pages: string[]; pagesHD: string[] }> {
  const res = await fetch(`/api/manga?action=pages&chapterId=${chapterId}`);
  if (!res.ok) return { pages: [], pagesHD: [] };
  const data = await res.json();

  const baseUrl = data.baseUrl || '';
  const hash = data.chapter?.hash || '';
  const files = data.chapter?.data || [];
  const filesSaver = data.chapter?.dataSaver || [];

  return {
    pagesHD: files.map((f: string) => `${baseUrl}/data/${hash}/${f}`),
    pages: filesSaver.map((f: string) => `${baseUrl}/data-saver/${hash}/${f}`),
  };
}
