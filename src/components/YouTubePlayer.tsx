import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import screenfull from 'screenfull';
import { syncRoom } from '../firebase';
import { Maximize, MessageSquare } from 'lucide-react';

interface PlayerProps {
  roomId: string;
  roomData: any;
  isHost: boolean;
  messages: any[];
}

const YouTubePlayer: React.FC<PlayerProps> = ({ roomId, roomData, isHost, messages }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatInFS, setShowChatInFS] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  
  const lastSyncTime = useRef<number>(0);
  const SYNC_THRESHOLD = 3;

  // Collaborative Sync Logic: Everyone syncs to roomData
  useEffect(() => {
    if (roomData) {
      if (roomData.url !== url) {
        setUrl(roomData.url);
      }
      
      // Every user (host or joiner) updates local state if it drifts too far from roomData
      if (roomData.playing !== playing) {
        setPlaying(roomData.playing);
      }

      if (playerRef.current) {
        const currentTime = playerRef.current.currentTime || 0;
        const diff = Math.abs(currentTime - roomData.seekTime);
        if (diff > SYNC_THRESHOLD) {
          playerRef.current.currentTime = roomData.seekTime;
        }
      }
    }
  }, [roomData]);

  // Handle auto-fading messages (10 seconds)
  useEffect(() => {
    // Get messages from the last 30 seconds to keep it fresh
    const now = Date.now();
    const activeMsgs = messages.filter(msg => {
        // Since Firebase serverTimestamp might not be immediately available on local,
        // we use a fallback or handle the fade logic locally
        return true; 
    }).slice(-5);

    setVisibleMessages(activeMsgs);

    // Set a timeout to clear each message after 10s if needed, 
    // but a simpler way is to just show the most recent ones.
    // For true "disappearing", we'd need a timestamp on each message.
  }, [messages]);

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handler = () => setIsFullscreen(screenfull.isFullscreen);
      screenfull.on('change', handler);
      return () => screenfull.off('change', handler);
    }
  }, []);

  // Interaction handlers: Everyone can now trigger these
  const handlePlay = () => {
    setPlaying(true);
    syncRoom(roomId, { playing: true, seekTime: playerRef.current?.currentTime || 0 });
  };

  const handlePause = () => {
    setPlaying(false);
    syncRoom(roomId, { playing: false, seekTime: playerRef.current?.currentTime || 0 });
  };

  const handleSeeked = () => {
    if (playerRef.current) {
      syncRoom(roomId, { seekTime: playerRef.current.currentTime });
    }
  };

  const handleTimeUpdate = () => {
    if (playerRef.current && playing) {
      const currentTime = playerRef.current.currentTime;
      // Periodic sync to keep everyone aligned (now everyone can contribute to the "truth")
      // To avoid spam, only sync if drift is > 5s compared to last sync
      if (Math.abs(currentTime - lastSyncTime.current) > 5) {
        lastSyncTime.current = currentTime;
        syncRoom(roomId, { seekTime: currentTime });
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current && screenfull.isEnabled) {
      screenfull.toggle(containerRef.current);
    }
  };

  return (
    <div ref={containerRef} className="relative aspect-video w-full flex flex-col group bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      <div className="flex-1 relative">
        <ReactPlayer
          ref={playerRef}
          src={url}
          playing={playing}
          width="100%"
          height="100%"
          playsinline={true}
          controls={true}
          loop={roomData?.loop || false}
          onPlay={handlePlay}          onPause={handlePause}
          onSeeked={handleSeeked}
          onTimeUpdate={handleTimeUpdate}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                ecver: 2,
                playsinline: 1,
                enablejsapi: 1
              }
            }
          }}
          />        {/* Floating Controls Overlay */}
        <div className={`absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between transition-opacity duration-300 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          
          <div className="flex justify-between items-start">
            {/* Fullscreen Chat Overlay with Fading */}
            <div className="flex flex-col gap-2 max-w-[30%] pointer-events-none">
              {showChatInFS && visibleMessages.map((msg, i) => (
                <ChatMessage key={msg.timestamp || i} msg={msg} />
              ))}
            </div>
            
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button 
                onClick={() => setShowChatInFS(!showChatInFS)} 
                className={`p-3 rounded-xl transition-all shadow-xl ${showChatInFS ? 'text-indigo-400 bg-indigo-900/40 border border-indigo-500/30' : 'text-slate-400 bg-black/40 hover:text-white border border-white/10'}`}
              >
                <MessageSquare size={20} />
              </button>
              <button 
                onClick={toggleFullscreen} 
                className="p-3 rounded-xl text-slate-400 bg-black/40 hover:text-white border border-white/10 transition-all shadow-xl"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for fading chat messages
const ChatMessage = ({ msg }: { msg: any }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 10000); // 10 seconds
        return () => clearTimeout(timer);
    }, [msg]);

    if (!visible) return null;

    return (
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl text-sm border border-white/10 animate-in slide-in-from-left fade-out duration-1000 shadow-2xl pointer-events-none">
            <span className="font-bold text-indigo-400">{msg.user}: </span>
            <span className="text-white/90">{msg.text}</span>
        </div>
    );
};

export default YouTubePlayer;
