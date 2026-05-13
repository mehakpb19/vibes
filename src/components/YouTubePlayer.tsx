import React, { useEffect, useRef, useState } from 'react';
import screenfull from 'screenfull';
import { syncRoom } from '../firebase';
import { Maximize, MessageSquare, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface PlayerProps {
  roomId: string;
  roomData: any;
  isHost: boolean;
  messages: any[];
}

const YouTubePlayer: React.FC<PlayerProps> = ({ roomId, roomData, isHost, messages }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatInFS, setShowChatInFS] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  
  const lastUpdateRef = useRef<number>(0);
  const isInternalChange = useRef<boolean>(false);

  const getYTId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    if (!window.YT) {
      const existingScript = document.getElementById('youtube-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    const initPlayer = () => {
        if (!playerElementRef.current || playerRef.current) return;
        playerRef.current = new window.YT.Player(playerElementRef.current, {
          height: '100%',
          width: '100%',
          videoId: getYTId(roomData?.url) || 'Rc2k_8skxtI',
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
            playsinline: 1
          },
          events: {
            onReady: () => {
                setTimeout(() => setIsReady(true), 500);
            },
            onStateChange: (event: any) => handleStateChange(event.data)
          }
        });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        initPlayer();
      };
    }

    return () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
            playerRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    if (roomData && isReady && playerRef.current && typeof playerRef.current.getVideoData === 'function') {
      const currentId = playerRef.current.getVideoData()?.video_id;
      const targetId = getYTId(roomData.url);
      
      if (targetId && targetId !== currentId) {
          playerRef.current.loadVideoById(targetId);
          lastUpdateRef.current = 0;
      }

      if (roomData.updatedAt > lastUpdateRef.current) {
        const isInitial = lastUpdateRef.current === 0;
        lastUpdateRef.current = roomData.updatedAt;
        isInternalChange.current = true;

        let expectedTime = roomData.startOffset || 0;
        if (roomData.playing) {
            expectedTime += (Date.now() - roomData.updatedAt) / 1000;
        }

        const currentTime = playerRef.current.getCurrentTime() || 0;
        const drift = Math.abs(currentTime - expectedTime);

        if (drift > 2 || isInitial) {
           playerRef.current.seekTo(expectedTime, true);
        }

        if (roomData.playing) {
            playerRef.current.playVideo();
        } else {
            playerRef.current.pauseVideo();
        }
        
        setTimeout(() => { isInternalChange.current = false; }, 1000);
      }
    }
  }, [roomData, isReady]);

  const handleStateChange = (state: number) => {
    if (isInternalChange.current || !playerRef.current) return;
    const time = playerRef.current.getCurrentTime() || 0;
    if (state === 1) {
        syncRoom(roomId, { playing: true, startOffset: time, updatedAt: Date.now() });
    } else if (state === 2) {
        syncRoom(roomId, { playing: false, startOffset: time, updatedAt: Date.now() });
    } else if (state === 0) {
        handleEnded();
    }
  };

  const handleEnded = () => {
    if (!isHost) return;
    if (roomData?.queue && roomData.queue.length > 0) {
      const nextVideo = roomData.queue[0];
      const updatedQueue = roomData.queue.slice(1);
      syncRoom(roomId, {
        url: nextVideo.url,
        playing: true,
        startOffset: 0,
        updatedAt: Date.now(),
        queue: updatedQueue,
        loop: false
      });
    } else {
      syncRoom(roomId, { playing: false, startOffset: 0, updatedAt: Date.now() });
    }
  };

  useEffect(() => {
    setVisibleMessages(messages.slice(-5));
  }, [messages]);

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handler = () => setIsFullscreen(screenfull.isFullscreen);
      screenfull.on('change', handler);
      return () => screenfull.off('change', handler);
    }
  }, []);

  const toggleFullscreen = () => {
    if (containerRef.current && screenfull.isEnabled) {
      screenfull.toggle(containerRef.current);
    }
  };

  return (
    <div ref={containerRef} className="relative aspect-video w-full flex flex-col group bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      {!isReady && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-indigo-400 font-bold animate-pulse">Loading Official Player...</p>
          </div>
      )}
      <div className="flex-1 relative">
        <div ref={playerElementRef} className="w-full h-full" />
        <div className={`absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between transition-opacity duration-300 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 max-w-[30%] pointer-events-none">
              {showChatInFS && visibleMessages.map((msg, i) => (
                <ChatMessage key={msg.timestamp || i} msg={msg} />
              ))}
            </div>
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => setShowChatInFS(!showChatInFS)} className={`p-3 rounded-xl transition-all shadow-xl ${showChatInFS ? 'text-indigo-400 bg-indigo-900/40 border border-indigo-500/30' : 'text-slate-400 bg-black/40 hover:text-white border border-white/10'}`}>
                <MessageSquare size={20} />
              </button>
              <button onClick={toggleFullscreen} className="p-3 rounded-xl text-slate-400 bg-black/40 hover:text-white border border-white/10 transition-all shadow-xl">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ msg }: { msg: any }) => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 10000);
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
