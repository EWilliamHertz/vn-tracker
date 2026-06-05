import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export default async function ReaderPage({ params }: { params: { chapterId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the chapter
  const { data: chapter } = await supabase
   .from('chapters')
   .select('*, manga_series(title)')
   .eq('id', params.chapterId)
   .single();

  if (!chapter) return <div>Chapter not found</div>;

  // Check Paywall
  let hasAccess =!chapter.is_premium;
  if (chapter.is_premium && user) {
    const { data: sub } = await supabase
     .from('user_subscriptions')
     .select('status')
     .eq('user_id', user.id)
     .single();
    if (sub?.status === 'active') hasAccess = true;
  }

  // Render Paywall Screen
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white">
        <Lock className="w-16 h-16 text-indigo-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Premium Chapter</h1>
        <p className="text-neutral-400 mb-8">Subscribe to support the Mangaka and read this chapter.</p>
        <a 
          href="/checkout" // We will connect this to Polar.sh later
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition-all"
        >
          Unlock for $5/month
        </a>
      </div>
    );
  }

  // Render High-Resolution Reader
  return (
    <div className="bg-black min-h-screen w-full">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full bg-gradient-to-b from-black/80 to-transparent p-4 z-50 flex justify-between text-white">
        <h2 className="font-bold">{chapter.manga_series.title}</h2>
        <span className="text-neutral-300">Chapter {chapter.chapter_number}</span>
      </div>

      {/* Reading Canvas with CSS Scroll Snapping */}
      <div className="max-w-3xl mx-auto h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {chapter.pages.map((imageUrl: string, index: number) => (
          <div key={index} className="w-full h-auto min-h-screen snap-start flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt={`Page ${index + 1}`} 
              className="w-full h-auto object-contain max-h-screen"
            />
          </div>
        ))}
      </div>
    </div>
  );
}