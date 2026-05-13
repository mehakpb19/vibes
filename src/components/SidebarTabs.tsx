import React, { useState } from 'react';
import { ListMusic, Plus, Play, X, Shuffle, User, Search as SearchIcon, Loader2, Music } from 'lucide-react';
import { syncRoom } from '../firebase';
import { MY_PLAYLIST_DATA } from '../myPlaylistData';

interface SidebarTabsProps {
  roomId: string;
  queue: any[];
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ roomId, queue = [] }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'myplaylist'>('search');
  const [playlistQuery, setPlaylistQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const instantPlay = (url: string) => {
    syncRoom(roomId, { 
      url, 
      playing: true, 
      startOffset: 0,
      updatedAt: Date.now(),
      loop: false
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Invidious instances (Different from Piped, more stable for some regions)
    const instances = [
      'https://invidious.projectsegfau.lt',
      'https://inv.tux.rs',
      'https://invidious.draw.to',
      'https://invidious.flokinet.to',
      'https://invidious.no-logs.com',
      'https://iv.melmac.space',
      'https://invidious.io.lol'
    ];

    let success = false;
    for (const instance of instances) {
      if (success) break;
      try {
        // Invidious API search path
        const response = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`, {
            signal: AbortSignal.timeout(4000) 
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setSearchResults(data.map((item: any) => ({
            id: item.videoId,
            title: item.title,
            artist: item.author,
            thumbnail: item.videoThumbnails ? item.videoThumbnails.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails[0].url : `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${item.videoId}`
          })));
          success = true;
        }
      } catch (error) {
        console.warn(`Search failed on Invidious instance ${instance}:`, error);
        continue; 
      }
    }

    if (!success) {
      alert("Search is currently unavailable. \n\nThis usually happens if your browser or network is blocking 'No-API' search servers. \n\nTry pasting a link directly as a fallback.");
    }
    setIsSearching(false);
  };

  const shuffleQueue = () => {
    if (queue.length < 2) return;
    syncRoom(roomId, { queue: [...queue].sort(() => Math.random() - 0.5) });
  };

  const playFromQueue = (url: string) => {
    syncRoom(roomId, { url, playing: true, startOffset: 0, updatedAt: Date.now(), loop: false });
  };

  const removeFromQueue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    syncRoom(roomId, { queue: queue.filter(item => item.id !== id) });
  };

  const addToQueue = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    syncRoom(roomId, { 
      queue: [...queue, { 
        url: item.url, 
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: item.title,
        thumbnail: item.thumbnail 
      }] 
    });
    alert("Added to queue!");
  };

  const filteredPlaylist = MY_PLAYLIST_DATA.filter(item => 
    item.title.toLowerCase().includes(playlistQuery.toLowerCase()) || 
    item.artist.toLowerCase().includes(playlistQuery.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="glass rounded-3xl flex flex-col overflow-hidden h-[500px]">
      <div className="flex p-2 bg-white/5 border-b border-white/10 gap-1">
        <button onClick={() => setActiveTab('search')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
          <SearchIcon size={14} /> Search
        </button>
        <button onClick={() => setActiveTab('myplaylist')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${activeTab === 'myplaylist' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
          <User size={14} /> My Vibes
        </button>
        <button onClick={() => setActiveTab('queue')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
          <ListMusic size={14} /> Queue ({queue.length})
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'queue' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex justify-between items-center border-b border-white/5 bg-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Room Queue</span>
                {queue.length > 1 && (
                    <button onClick={shuffleQueue} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 px-2 py-1 rounded-lg uppercase">
                        <Shuffle size={12} /> Shuffle
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ListMusic size={48} />
                  <p className="text-sm italic mt-4">Queue is empty.</p>
                </div>
              ) : (
                queue.map((item) => (
                  <div key={item.id} onClick={() => playFromQueue(item.url)} className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg shrink-0 w-14 h-10 bg-indigo-600/20 flex items-center justify-center">
                      {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" /> : <Play size={16} className="text-indigo-400" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-slate-200 truncate font-bold">{item.title}</p>
                    </div>
                    <button onClick={(e) => removeFromQueue(item.id, e)} className="p-2 text-slate-400 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'search' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <form onSubmit={handleSearch} className="relative group">
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search YouTube songs..." 
                    className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-xs focus:border-indigo-500 outline-none text-indigo-200 placeholder:text-indigo-400/50 transition-all" 
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors">
                  {isSearching ? <Loader2 size={14} className="animate-spin" /> : <SearchIcon size={14} />}
                </button>
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {searchResults.length === 0 && !isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                  <Music size={48} />
                  <p className="text-xs mt-4">Search for your favorite songs and sync them instantly!</p>
                </div>
              ) : (
                searchResults.map((item) => (
                  <div key={item.id} onClick={() => instantPlay(item.url)} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 group cursor-pointer transition-all">
                    <img src={item.thumbnail} className="w-16 h-10 object-cover rounded-lg" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs truncate font-bold text-slate-200">{item.title}</p>
                      <p className="text-[9px] text-slate-500">{item.artist}</p>
                    </div>
                    <button onClick={(e) => addToQueue(item, e)} className="p-2 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                      <Plus size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5 relative">
              <input type="text" value={playlistQuery} onChange={(e) => setPlaylistQuery(e.target.value)} placeholder="Search your vibes..." className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm outline-none" />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon size={16} /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              <div className="px-2 py-1 mb-2 text-[10px] font-bold text-slate-500 uppercase">My Playlist ({MY_PLAYLIST_DATA.length})</div>
              {filteredPlaylist.map((item, index) => (
                <div key={`${item.id}-${index}`} onClick={() => instantPlay(`https://www.youtube.com/watch?v=${item.id}`)} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 group cursor-pointer">
                  <img src={`https://img.youtube.com/vi/${item.id}/default.jpg`} className="w-16 h-10 object-cover rounded-lg" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs truncate font-bold text-slate-200">{item.title}</p>
                    <p className="text-[9px] text-slate-500">{item.artist}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); syncRoom(roomId, { queue: [...queue, { url: `https://www.youtube.com/watch?v=${item.id}`, id: Date.now().toString(), title: item.title, thumbnail: `https://img.youtube.com/vi/${item.id}/default.jpg` }] }); }} className="p-2 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100"><Plus size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarTabs;
