import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ListMusic, Plus, Play, Loader2, X, Shuffle, ListPlus, User } from 'lucide-react';
import { syncRoom, YOUTUBE_API_KEY } from '../firebase';
import { MY_PLAYLIST_DATA } from '../myPlaylistData';

interface SidebarTabsProps {
  roomId: string;
  queue: any[];
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ roomId, queue = [] }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'myplaylist'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if ((YOUTUBE_API_KEY as string) === "YOUR_YOUTUBE_API_KEY_HERE") return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}`
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

  const addToQueue = (videoOrItem: any, e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    let videoUrl = '';
    let title = '';
    let thumbnail = '';

    if (videoOrItem.id && typeof videoOrItem.id === 'string') {
        // From MY_PLAYLIST_DATA
        videoUrl = `https://www.youtube.com/watch?v=${videoOrItem.id}`;
        title = videoOrItem.title;
        thumbnail = `https://img.youtube.com/vi/${videoOrItem.id}/default.jpg`;
    } else {
        // From Search API
        videoUrl = `https://www.youtube.com/watch?v=${videoOrItem.id.videoId}`;
        title = videoOrItem.snippet.title;
        thumbnail = videoOrItem.snippet.thumbnails.default.url;
    }

    const newItem = { 
      url: videoUrl, 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title: title,
      thumbnail: thumbnail
    };
    syncRoom(roomId, { queue: [...queue, newItem], loop: false });
  };

  const instantPlay = (videoOrItem: any) => {
    let videoUrl = '';
    if (videoOrItem.id && typeof videoOrItem.id === 'string') {
        videoUrl = `https://www.youtube.com/watch?v=${videoOrItem.id}`;
    } else {
        videoUrl = `https://www.youtube.com/watch?v=${videoOrItem.id.videoId}`;
    }
    syncRoom(roomId, { 
      url: videoUrl, 
      playing: true, 
      seekTime: 0,
      loop: false
    });
  };

  const fetchPlaylistItems = async (playlistId: string) => {
    if ((YOUTUBE_API_KEY as string) === "YOUR_YOUTUBE_API_KEY_HERE") return;
    setIsImporting(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        const playlistVideos = data.items.map((item: any) => ({
          url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.default.url
        }));
        syncRoom(roomId, { queue: [...queue, ...playlistVideos] });
      }
    } catch (error) {
      console.error("Playlist fetch error:", error);
      alert("Failed to fetch playlist items.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    const playlistMatch = manualUrl.match(/[&?]list=([^&]+)/);
    if (playlistMatch) {
      fetchPlaylistItems(playlistMatch[1]);
    } else {
      const newItem = { url: manualUrl.trim(), id: Date.now().toString() };
      syncRoom(roomId, { queue: [...queue, newItem] });
    }
    setManualUrl('');
  };

  const shuffleQueue = () => {
    if (queue.length < 2) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    syncRoom(roomId, { queue: shuffled });
  };

  const playFromQueue = (url: string) => {
    syncRoom(roomId, { url, playing: true, seekTime: 0, loop: false });
  };

  const removeFromQueue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const updatedQueue = queue.filter(item => item.id !== id);
    syncRoom(roomId, { queue: updatedQueue });
  };

  return (
    <div className="glass rounded-3xl flex flex-col overflow-hidden h-[500px]">
      <div className="flex p-2 bg-white/5 border-b border-white/10 gap-1">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${
            activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <SearchIcon size={14} />
          Search
        </button>
        <button
          onClick={() => setActiveTab('myplaylist')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${
            activeTab === 'myplaylist' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={14} />
          My Playlist
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${
            activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ListMusic size={14} />
          Queue ({queue.length})
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'queue' ? (
          <>
            <div className="px-4 py-2 flex justify-between items-center border-b border-white/5 bg-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shared Queue</span>
                {queue.length > 1 && (
                    <button 
                        onClick={shuffleQueue}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest bg-indigo-400/10 px-2 py-1 rounded-lg"
                    >
                        <Shuffle size={12} /> Shuffle
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <ListMusic size={48} />
                  <p className="text-sm italic">Queue is empty.<br/>Search for songs or paste a playlist link!</p>
                </div>
              ) : (
                queue.map((item, i) => (
                  <div 
                    key={item.id} 
                    onClick={() => playFromQueue(item.url)}
                    className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-lg shrink-0">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-14 h-10 object-cover" />
                      ) : (
                        <div className="w-14 h-10 bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {i + 1}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-slate-200 truncate font-bold" dangerouslySetInnerHTML={{ __html: item.title || 'YouTube Video' }} />
                      <p className="text-[10px] text-slate-500 truncate">{item.url}</p>
                    </div>
                    <button 
                      onClick={(e) => removeFromQueue(item.id, e)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddManual} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Paste URL or Playlist Link..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="submit" disabled={isImporting} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors disabled:opacity-50">
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <ListPlus size={18} />}
              </button>
            </form>
          </>
        ) : activeTab === 'search' ? (
          <>
            <div className="p-4 border-b border-white/10 bg-white/5 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search music, artists..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon size={16} />
              </div>
              {loading && (
                <div className="absolute right-7 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {results.map((video) => (
                <div 
                    key={video.id.videoId} 
                    onClick={() => instantPlay(video)}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-lg shrink-0">
                    <img 
                      src={video.snippet.thumbnails.default.url} 
                      alt="" 
                      className="w-20 h-12 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={20} fill="white" className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[13px] text-slate-200 truncate font-bold leading-tight" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                    <p className="text-[10px] text-slate-500">{video.snippet.channelTitle}</p>
                  </div>
                  <button 
                    onClick={(e) => addToQueue(video, e)}
                    title="Add to Queue"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-all shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
              {results.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <SearchIcon size={48} className="mb-4" />
                  <p className="text-sm italic">{query ? 'No results found' : 'Start typing to find songs'}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
            <div className="px-2 py-1 mb-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Playlist ({MY_PLAYLIST_DATA.length} songs)</span>
            </div>
            {MY_PLAYLIST_DATA.map((item, index) => (
              <div 
                  key={`${item.id}-${index}`} 
                  onClick={() => instantPlay(item)}
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg shrink-0">
                  <img 
                    src={`https://img.youtube.com/vi/${item.id}/default.jpg`} 
                    alt="" 
                    className="w-20 h-12 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[13px] text-slate-200 truncate font-bold leading-tight">{item.title}</p>
                  <p className="text-[10px] text-slate-500">{item.artist}</p>
                </div>
                <button 
                  onClick={(e) => addToQueue(item, e)}
                  title="Add to Queue"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-all shrink-0"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarTabs;
