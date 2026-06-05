import Link from 'next/link';
import { createClient } from '../utils/supabase/server';
import { BookOpen, Library, ShieldAlert } from 'lucide-react';

export default async function LandingPage() {
  const supabase = await createClient();
  
  // Fetch from our live Supabase Database
  const { data: availableTitles, error } = await supabase
   .from('manga_series')
   .select('*');

  const titles = availableTitles || [];

  return (
    <div className="min-h-screen bg-[#111118] text-gray-200 flex overflow-hidden font-sans">
      {/* Main Splashscreen Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1b1b26] to-[#0f0f15] z-0"></div>
        
        <div className="z-10 text-center max-w-2xl bg-[#171722]/90 p-12 rounded-3xl shadow-2xl border border-neutral-800 backdrop-blur-md">
          <BookOpen className="w-16 h-16 text-[#c084fc] mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#e2a8ff] to-[#818cf8]">
            Cozy Manga & VN Haven
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            A secure, warm community for manga, comic and visual novel enthusiasts. 
            Read beautiful, high-resolution indie creations and support storytellers directly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full font-bold transition-all shadow-lg shadow-purple-500/20 hover:scale-[1.02]"
            >
              Enter the Library
            </Link>
            <Link 
              href="/admin" 
              className="px-8 py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-full font-bold transition-all"
            >
              Admin Controls
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Sidebar with Available Titles */}
      <div className="w-80 bg-[#0c0c12] border-l border-neutral-900 p-6 hidden lg:block z-10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 border-b border-neutral-900 pb-3">
          <Library className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-gray-300">Available Titles</h3>
        </div>
        
        {titles.length === 0? (
          <div className="text-center py-8 px-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">No titles installed yet.</p>
            <p className="text-xs text-neutral-500 mt-1">Logged-in admins can install comics from the Admin link.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {titles.map(title => (
              <div key={title.id} className="group cursor-pointer">
                <div className="w-full h-36 bg-neutral-900 rounded-lg mb-2 overflow-hidden border border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={title.cover_image_url || '/placeholder.png'} 
                    alt={title.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="font-semibold text-gray-200 group-hover:text-[#e2a8ff] transition-colors">{title.title}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{title.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}