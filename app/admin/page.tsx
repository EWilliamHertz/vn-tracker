import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { Shield, CloudDownload, Library, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage({ searchParams }: { searchParams: { success?: string; error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // STAGE-GATE ADMIN CHECK: Restrict strictly to your email
  const isAdmin = user?.email === 'ewilliamhe@gmail.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#111118] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-red-950/20 border border-red-900/50 p-8 rounded-2xl">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-neutral-400 mb-6">You must be logged in as ewilliamhe@gmail.com to access the admin engine.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-5 py-2.5 bg-neutral-900 rounded-xl hover:bg-neutral-800 text-sm font-semibold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <Link href="/login" className="px-5 py-2.5 bg-red-600 rounded-xl hover:bg-red-700 text-sm font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Server Action executing directly inside Cloud Shell/Vercel
  const installComic = async (formData: FormData) => {
    'use server'
    const episode = formData.get('episode') as string;
    const supabase = createClient();

    try {
      if (episode === '1') {
        // 1. Install Manga Series Record
        const { data: series, error: sErr } = await supabase
         .from('manga_series')
         .upsert({
            id: '86fb8bb5-5ba7-4a0b-99f1-33758b29ea9f', // Consistent UUID
            title: 'Pepper & Carrot',
            author: 'David Revoy',
            cover_image_url: 'https://peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01P00.jpg',
            description: 'The beautiful open-source fantasy comic about a young witch Pepper and her cat Carrot.'
          })
         .select()
         .single();

        if (sErr) throw new Error(sErr.message);

        // 2. Install Chapter Page Indexing (David Revoy's original CDN endpoints)
        const { error: cErr } = await supabase
         .from('chapters')
         .upsert({
            id: 'da9db6b3-6e3e-48a5-8e3d-010df046bcbe',
            series_id: series.id,
            chapter_number: 1,
            title: 'The Potion of Flight',
            is_premium: false,
            pages:
          });

        if (cErr) throw new Error(cErr.message);
      }

      if (episode === '3') {
        const { data: series, error: sErr } = await supabase
         .from('manga_series')
         .upsert({
            id: '86fb8bb5-5ba7-4a0b-99f1-33758b29ea9f',
            title: 'Pepper & Carrot',
            author: 'David Revoy',
            cover_image_url: 'https://peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01P00.jpg',
            description: 'The beautiful open-source fantasy comic.'
          })
         .select()
         .single();

        if (sErr) throw new Error(sErr.message);

        const { error: cErr } = await supabase
         .from('chapters')
         .upsert({
            id: 'f9b5c2c4-8461-46da-b789-9a2df6ea2d6b',
            series_id: series.id,
            chapter_number: 3,
            title: 'The Secret Ingredients',
            is_premium: true, // Paywalled to verify checkout setups!
            pages:
          });

        if (cErr) throw new Error(cErr.message);
      }

      return redirect('/admin?success=Installed Successfully');
    } catch (err: any) {
      return redirect(`/admin?error=${encodeURIComponent(err.message)}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#111118] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center bg-[#171722] p-6 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#8b5cf6]" />
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-xs text-neutral-400">Authenticated: {user.email}</p>
            </div>
          </div>
          <Link href="/" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-semibold transition-all">
            Go to Library
          </Link>
        </div>

        {/* Notifications */}
        {searchParams.success && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {searchParams.success}
          </div>
        )}
        {searchParams.error && (
          <div className="p-4 bg-red-950/30 border border-red-800/50 text-red-400 rounded-xl">
            {searchParams.error}
          </div>
        )}

        {/* Action Panel */}
        <div className="bg-[#171722] p-8 rounded-2xl border border-neutral-800 space-y-6">
          <div className="flex items-center gap-2">
            <CloudDownload className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold">Comic Deployment Engine</h2>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Choose a licensed comic episode below. Our system will dynamically structure and map the high-resolution pages without using system storage.
          </p>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* Episode 1 */}
            <div className="bg-[#111118] p-6 rounded-xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Pepper & Carrot — Ep. 1</h3>
                <p className="text-xs text-neutral-500 mb-4">The Potion of Flight (Free Chapter)</p>
              </div>
              <form action={installComic}>
                <input type="hidden" name="episode" value="1" />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg font-bold text-sm transition-all">
                  Index and Deploy
                </button>
              </form>
            </div>

            {/* Episode 3 */}
            <div className="bg-[#111118] p-6 rounded-xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Pepper & Carrot — Ep. 3</h3>
                <p className="text-xs text-neutral-500 mb-4">The Secret Ingredients (Premium Chapter)</p>
              </div>
              <form action={installComic}>
                <input type="hidden" name="episode" value="3" />
                <button type="submit" className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] py-2.5 rounded-lg font-bold text-sm transition-all">
                  Index and Deploy (Premium)
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}