import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'rating'; // rating, views, recent

    let query = supabase.from('manga_series').select('*');

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (genre) {
      query = query.contains('genres', [genre]);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Sorting
    switch (sort) {
      case 'views':
        query = query.order('view_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating':
      default:
        query = query.order('average_rating', { ascending: false });
        break;
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      series: data || [],
      count,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      title,
      description,
      cover_url,
      author,
      status,
      series_type,
      genres,
    } = body;

    // Validate required fields
    if (!slug || !title || !series_type) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, series_type' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('manga_series')
      .insert({
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        title,
        description,
        cover_url,
        author,
        status: status || 'ongoing',
        series_type,
        genres: genres || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
