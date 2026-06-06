import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for MangaDex API — avoids CORS and hotlink issues
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const mangadexId = searchParams.get('mangadexId') || '';
  const chapterId = searchParams.get('chapterId') || '';
  const offset = searchParams.get('offset') || '0';
  const limit = searchParams.get('limit') || '100';

  const headers: Record<string, string> = { 'User-Agent': 'Ouryie/1.0 (https://ouryie.vercel.app)' };

  try {
    if (action === 'chapters') {
      // Fetch chapter list for a manga
      const url = `https://api.mangadex.org/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group`;
      const res = await fetch(url, { headers, next: { revalidate: 300 } });
      if (!res.ok) return NextResponse.json({ error: 'MangaDex API error', status: res.status }, { status: res.status });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'pages') {
      // Fetch page URLs for a chapter
      const url = `https://api.mangadex.org/at-home/server/${chapterId}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return NextResponse.json({ error: 'MangaDex API error', status: res.status }, { status: res.status });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'cover') {
      // Proxy cover image to avoid hotlink blocking
      const imageUrl = searchParams.get('url') || '';
      if (!imageUrl || !imageUrl.includes('mangadex.org')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
      const res = await fetch(imageUrl, { headers });
      if (!res.ok) return new NextResponse('Image not found', { status: 404 });
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use: chapters, pages, cover' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
