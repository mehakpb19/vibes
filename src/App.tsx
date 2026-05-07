import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, initializeRoom, syncRoom } from './firebase';
import YouTubePlayer from './components/YouTubePlayer';
import Chat from './components/Chat';
import SidebarTabs from './components/SidebarTabs';
import { Users, Tv, Copy, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedRoomId = localStorage.getItem('syncvibe_roomId');
    const savedUsername = localStorage.getItem('syncvibe_username');
    const savedIsHost = localStorage.getItem('syncvibe_isHost') === 'true';

    if (savedRoomId && savedUsername) {
      setRoomId(savedRoomId);
      setUsername(savedUsername);
      setIsHost(savedIsHost);
      setInRoom(true);
    }
  }, []);

  useEffect(() => {
    if (inRoom && roomId) {
      // Save session
      localStorage.setItem('syncvibe_roomId', roomId);
      localStorage.setItem('syncvibe_username', username);
      localStorage.setItem('syncvibe_isHost', isHost.toString());

      const roomRef = ref(db, `rooms/${roomId}`);
      const unsubscribeRoom = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setRoomData(data);
      });

      const chatRef = ref(db, `rooms/${roomId}/chat`);
      const unsubscribeChat = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMessages(Object.values(data));
        } else {
          setMessages([]);
        }
      });

      return () => {
        unsubscribeRoom();
        unsubscribeChat();
      };
    }
  }, [inRoom, roomId]);

  const createRoom = () => {
    if (!username.trim()) return alert('Please enter a username');
    // Generate an uppercase room ID for better readability and matching
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialData = {
      url: 'https://www.youtube.com/watch?v=Rc2k_8skxtI',
      playing: true,
      seekTime: 0,
      host: username,
      queue: [],
      loop: true // Initial video loops
    };
    initializeRoom(newRoomId, initialData);
    setRoomId(newRoomId);
    setInRoom(true);
    setIsHost(true);
  };

  const joinRoom = () => {
    if (!username.trim()) return alert('Please enter a username');
    if (!roomId.trim()) return alert('Please enter a Room ID');
    const cleanRoomId = roomId.trim().toUpperCase();
    setRoomId(cleanRoomId);
    setInRoom(true);
    setIsHost(false);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  const handleLogout = () => {
    localStorage.removeItem('syncvibe_roomId');
    localStorage.removeItem('syncvibe_username');
    localStorage.removeItem('syncvibe_isHost');
    setInRoom(false);
    setRoomId('');
    setRoomData(null);
    setMessages([]);
  };

  if (!inRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
        <div className="w-full max-w-md p-8 glass-dark rounded-3xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4">
              <Tv size={48} />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent text-center">
              SyncVibe
            </h1>
            <p className="text-slate-400">Watch videos together in real-time.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Your Name</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 transition-all text-lg"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={createRoom} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                Create Room
              </button>
            </div>
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 transition-all text-center tracking-widest text-lg uppercase"
              />
              <button onClick={joinRoom} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all active:scale-95">
                Join Existing Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 lg:p-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 glass p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
            <Tv size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">SyncVibe</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users size={12} />
              <span>{roomData?.host}'s Room</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 border border-white/5 rounded-xl px-4 py-2 gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Room ID:</span>
            <code className="text-indigo-400 font-mono font-bold tracking-widest">{roomId}</code>
            <button onClick={copyRoomId} className="hover:text-indigo-400 transition-colors">
              <Copy size={16} />
            </button>
          </div>
          <button onClick={handleLogout} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <YouTubePlayer roomId={roomId} roomData={roomData} isHost={isHost} messages={messages} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <SidebarTabs roomId={roomId} queue={roomData?.queue} isHost={isHost} />
          <Chat roomId={roomId} username={username} messages={messages} />
        </div>
      </main>
      <footer className="text-center text-slate-600 text-xs py-4">
        SyncVibe v1.0 • Built with React & Firebase
      </footer>
    </div>
  );
};

export default App;
