import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  
  const signIn = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return redirect('/login?message=Could not authenticate user');
    return redirect('/dashboard');
  }

  const signUp = async (formData: FormData) => {
    'use server'
    const headersList = headers();
    const origin = headersList.get('origin') || 'http://localhost:3000';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return redirect('/login?message=Could not sign up');
    return redirect('/login?message=Check your email to continue sign in process');
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#23232f] border border-gray-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-8">Sign in or create an account to start reading</p>
        
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-[#15151e] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full bg-[#15151e] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] outline-none transition-all" 
            />
          </div>
          
          <div className="flex gap-4 mt-4">
            <button formAction={signIn} className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg py-3 font-semibold transition-all">
              Log In
            </button>
            <button formAction={signUp} className="flex-1 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-lg py-3 font-semibold transition-all">
              Sign Up
            </button>
          </div>

          {searchParams?.message && (
            <p className="mt-4 p-4 bg-[#15151e] border border-gray-800 text-gray-300 text-sm text-center rounded-lg">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}