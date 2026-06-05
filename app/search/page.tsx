'use client';
import { useState } from 'react';

export default function SearchMangaPage() {
  const [query, setQuery] = useState('');
  const = useState<any>();

  const searchAniList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // The GraphQL query to search AniList for Manga
    const graphqlQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: MANGA) {
            id
            title { romaji english }
            coverImage { large }
          }
        }
      }
    `;

    // Make the request to the free public API
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: query }
      })
    });

    const data = await response.json();
    setResults(data.data.Page.media);
  };

  return (
    <div className="min-h-screen bg-[#1a1a24] p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Search Global Database</h1>
      
      <form onSubmit={searchAniList} className="flex gap-4 mb-8">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any manga..."
          className="flex-1 bg-[#23232f] border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-[#8b5cf6]"
        />
        <button type="submit" className="bg-[#8b5cf6] px-6 py-3 rounded-lg font-bold">Search</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {results.map((manga) => (
          <div key={manga.id} className="bg-[#23232f] rounded-lg p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={manga.coverImage.large} alt={manga.title.romaji} className="w-full h-48 object-cover rounded mb-4" />
            <h3 className="font-bold text-sm truncate">{manga.title.english || manga.title.romaji}</h3>
            
            {/* Here you would add buttons to trigger a Supabase insert to your reading_lists table */}
            <select className="w-full mt-4 bg-[#15151e] border border-gray-700 text-xs p-2 rounded">
              <option value="">Add to list...</option>
              <option value="currently_reading">Currently Reading</option>
              <option value="want_to_read">Want to Read</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}