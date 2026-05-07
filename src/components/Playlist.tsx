import React, { useState } from 'react';
import { syncRoom } from '../firebase';
import { ListMusic, Plus, Play } from 'lucide-react';

interface PlaylistProps {
  roomId: string;
  queue: any[];
  isHost: boolean;
}

const Playlist: React.FC<PlaylistProps> = ({ roomId, queue = [], isHost }) => {
  const [newUrl, setNewUrl] = useState('');

  const addToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      const updatedQueue = [...queue, { url: newUrl.trim(), id: Date.now().toString() }];
      syncRoom(roomId, { queue: updatedQueue });
      setNewUrl('');
    }
  };

  const playVideo = (url: string) => {
    syncRoom(roomId, { url, playing: true, seekTime: 0 });
  };

  return (
    <div className="w-80 glass rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <ListMusic size={18} />
        <h3 className="font-semibold">Video Queue</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {queue.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm italic">
            Queue is empty. Add a YouTube link!
          </div>
        ) : (
          queue.map((item, i) => (
            <div key={item.id} className="group relative flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-12 h-8 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold">
                  {i + 1}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-200 truncate font-medium">
                  {item.title || item.url}
                </p>
                {item.title && <p className="text-[10px] text-slate-500 truncate">{item.url}</p>}
              </div>
              <button 
                onClick={() => playVideo(item.url)}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play size={14} fill="currentColor" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addToQueue} className="p-4 border-t border-white/10 bg-white/5 flex flex-col gap-2">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste YouTube URL or Playlist ID"
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl transition-colors font-medium text-sm shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} /> Add to Queue
        </button>
      </form>
    </div>
  );
};

export default Playlist;
