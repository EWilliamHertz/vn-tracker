import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get the site URL from environment or construct from request headers
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!siteUrl) {
      const headersList = await headers();
      const origin = headersList.get('origin');
      siteUrl = origin || 'http://localhost:3000';
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { message: error.message || 'Could not sign up' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email to confirm your account',
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
