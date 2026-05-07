import React, { useState } from 'react';
import { Search as SearchIcon, Plus, Loader2 } from 'lucide-react';
import { syncRoom, YOUTUBE_API_KEY } from '../firebase';

interface SearchProps {
  roomId: string;
  queue: any[];
}

const Search: React.FC<SearchProps> = ({ roomId, queue = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
        alert("Please provide a valid YouTube API Key in src/firebase.ts");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        setResults(data.items);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = (video: any) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    const updatedQueue = [...queue, { 
        url: videoUrl, 
        id: Date.now().toString(),
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.default.url
    }];
    syncRoom(roomId, { queue: updatedQueue });
    // Optional: clear results after adding
    // setResults([]);
    // setQuery('');
  };

  return (
    <div className="glass rounded-2xl flex flex-col overflow-hidden h-fit">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <SearchIcon size={18} />
        <h3 className="font-semibold">Search YouTube</h3>
      </div>

      <form onSubmit={handleSearch} className="p-4 border-b border-white/10 bg-white/5 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <SearchIcon size={18} />}
        </button>
      </form>

      <div className="max-h-60 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {results.length === 0 && !loading && (
          <p className="text-center text-slate-500 py-4 text-xs">Search for music to add to queue</p>
        )}
        {results.map((video) => (
          <div key={video.id.videoId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <img 
              src={video.snippet.thumbnails.default.url} 
              alt="" 
              className="w-16 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-slate-200 truncate font-medium" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
              <p className="text-[10px] text-slate-500">{video.snippet.channelTitle}</p>
            </div>
            <button 
              onClick={() => addToQueue(video)}
              className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
