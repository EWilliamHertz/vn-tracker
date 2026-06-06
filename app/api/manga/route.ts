import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for MangaDex API + images
// Solves: CORS issues, hotlink blocking, Cloudflare 403 on at-home CDN nodes
const MD_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (compatible; Ouryie/1.0; +https://ouryie.vercel.app)',
  Accept: 'application/json',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    // ── Fetch chapters for a manga ──────────────────────────
    if (action === 'chapters') {
      const mangadexId = searchParams.get('mangadexId') || '';
      const offset = searchParams.get('offset') || '0';
      const limit = searchParams.get('limit') || '100';
      const url = `https://api.mangadex.org/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group`;
      const res = await fetch(url, { headers: MD_HEADERS, next: { revalidate: 300 } });
      if (!res.ok) return NextResponse.json({ error: 'MangaDex API error', status: res.status }, { status: res.status });
      return NextResponse.json(await res.json());
    }

    // ── Fetch page image list for a chapter ─────────────────
    if (action === 'pages') {
      const chapterId = searchParams.get('chapterId') || '';
      const url = `https://api.mangadex.org/at-home/server/${chapterId}`;
      const res = await fetch(url, { headers: MD_HEADERS });
      if (!res.ok) return NextResponse.json({ error: 'MangaDex API error', status: res.status }, { status: res.status });
      const data = await res.json();

      // IMPORTANT: Replace the at-home node URL with uploads.mangadex.org
      // At-home nodes (*.mangadex.network) use Cloudflare which returns 403
      // for requests without specific headers. uploads.mangadex.org always works.
      const hash = data.chapter?.hash || '';
      const files = data.chapter?.data || [];
      const filesSaver = data.chapter?.dataSaver || [];

      // Return pre-built proxied URLs so the client just uses them directly
      return NextResponse.json({
        pages: filesSaver.map((f: string) => `/api/manga?action=image&hash=${hash}&file=${encodeURIComponent(f)}&q=saver`),
        pagesHD: files.map((f: string) => `/api/manga?action=image&hash=${hash}&file=${encodeURIComponent(f)}&q=full`),
        totalPages: files.length,
      });
    }

    // ── Proxy a manga page image ────────────────────────────
    if (action === 'image') {
      const hash = searchParams.get('hash') || '';
      const file = searchParams.get('file') || '';
      const quality = searchParams.get('q') === 'full' ? 'data' : 'data-saver';

      if (!hash || !file) {
        return new NextResponse('Missing hash or file', { status: 400 });
      }

      const imageUrl = `https://uploads.mangadex.org/${quality}/${hash}/${file}`;
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Ouryie/1.0; +https://ouryie.vercel.app)',
          Accept: 'image/*',
        },
      });

      if (!res.ok) {
        return new NextResponse(`Image not found (${res.status})`, { status: res.status });
      }

      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'Content-Length': buffer.byteLength.toString(),
        },
      });
    }

    // ── Proxy a cover image ─────────────────────────────────
    if (action === 'cover') {
      const imageUrl = searchParams.get('url') || '';
      if (!imageUrl || !imageUrl.includes('mangadex.org')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Ouryie/1.0; +https://ouryie.vercel.app)',
          Accept: 'image/*',
        },
      });
      if (!res.ok) return new NextResponse('Image not found', { status: 404 });
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use: chapters, pages, image, cover' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
