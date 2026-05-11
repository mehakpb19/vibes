import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, initializeRoom, onDisconnect, remove, set, serverTimestamp } from './firebase';
import YouTubePlayer from './components/YouTubePlayer';
import Chat from './components/Chat';
import SidebarTabs from './components/SidebarTabs';
import { Users, Tv, LogOut, Circle, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const sessionId = useRef(Math.random().toString(36).substring(2, 10)).current;

  // Load session and check for URL room ID on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room')?.toUpperCase();
    
    const savedRoomId = localStorage.getItem('syncvibe_roomId');
    const savedUsername = localStorage.getItem('syncvibe_username');
    const savedIsHost = localStorage.getItem('syncvibe_isHost') === 'true';

    // Logic:
    // 1. If there's a room in the URL:
    //    - If it matches our saved room AND we have a saved username, auto-join (refresh case).
    //    - Otherwise, show entry screen for that room (new join via link).
    // 2. If no room in the URL:
    //    - If we have a saved room and username, auto-join (returning user).
    //    - Otherwise, if we have a saved username, pre-fill it for room creation.

    if (urlRoomId) {
      setRoomId(urlRoomId);
      if (urlRoomId === savedRoomId && savedUsername) {
        setUsername(savedUsername);
        setIsHost(savedIsHost);
        setInRoom(true);
      } else {
        // For new rooms via link, we don't auto-fill to ensure they "enter" their name
        setInRoom(false);
      }
    } else if (savedRoomId && savedUsername) {
      setRoomId(savedRoomId);
      setUsername(savedUsername);
      setIsHost(savedIsHost);
      setInRoom(true);
      
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${savedRoomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    if (inRoom && roomId && username) {
      // Save session
      localStorage.setItem('syncvibe_roomId', roomId);
      localStorage.setItem('syncvibe_username', username);
      localStorage.setItem('syncvibe_isHost', isHost.toString());

      // Update URL if not already present
      const params = new URLSearchParams(window.location.search);
      if (params.get('room') !== roomId) {
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }

      const roomRef = ref(db, `rooms/${roomId}`);
      const unsubscribeRoom = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setRoomData(data);
      });

      const chatRef = ref(db, `rooms/${roomId}/chat`);
      const unsubscribeChat = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesList = Object.entries(data).map(([id, msg]: [string, any]) => ({
            ...msg,
            id
          }));
          setMessages(messagesList);
        } else {
          setMessages([]);
        }
      });

      // Presence System - Use unique sessionId to avoid collisions
      const userPresenceRef = ref(db, `rooms/${roomId}/users/${sessionId}`);
      const connectedRef = ref(db, '.info/connected');

      const unsubscribeConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Add user to presence list
          set(userPresenceRef, {
            username,
            lastActive: serverTimestamp()
          });
          // Remove on disconnect
          onDisconnect(userPresenceRef).remove();
        }
      });

      // Count online users
      const usersRef = ref(db, `rooms/${roomId}/users`);
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (users) {
          setOnlineCount(Object.keys(users).length);
        } else {
          setOnlineCount(0);
        }
      });

      return () => {
        unsubscribeRoom();
        unsubscribeChat();
        unsubscribeUsers();
        unsubscribeConnected();
        remove(userPresenceRef);
      };
    }
  }, [inRoom, roomId, username, sessionId, isHost]);

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

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  const handleLogout = () => {
    // Explicitly remove presence before logout
    if (roomId) {
      const userPresenceRef = ref(db, `rooms/${roomId}/users/${sessionId}`);
      remove(userPresenceRef);
    }
    localStorage.removeItem('syncvibe_roomId');
    localStorage.removeItem('syncvibe_username');
    localStorage.removeItem('syncvibe_isHost');
    
    // Clear URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);

    setInRoom(false);
    setRoomId('');
    setUsername('');
    setRoomData(null);
    setMessages([]);
    setOnlineCount(0);
  };

  if (!inRoom) {
    const params = new URLSearchParams(window.location.search);
    const hasInvite = params.has('room');

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
            
            {hasInvite ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-center">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">You're Invited to</p>
                  <p className="text-lg font-mono font-bold text-white tracking-[0.2em]">{roomId}</p>
                </div>
                <button onClick={joinRoom} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                  <Users size={20} />
                  Join Room
                </button>
                <button onClick={() => {
                  const newUrl = window.location.origin + window.location.pathname;
                  window.history.pushState({ path: newUrl }, '', newUrl);
                  setRoomId('');
                }} className="w-full text-slate-500 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors">
                  Or Create Your Own Room
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button onClick={createRoom} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                  Create Room
                </button>
                <p className="text-center text-slate-500 text-[10px] mt-6 uppercase tracking-[0.2em] font-bold">
                  Start a session and share the link to invite friends
                </p>
              </div>
            )}
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users size={12} />
                <span>{roomData?.host}'s Room</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <Circle size={8} fill="currentColor" />
                <span>{onlineCount} Online</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 border border-white/5 rounded-xl px-4 py-2 gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invite:</span>
            <code className="text-indigo-400 font-mono font-bold tracking-widest hidden sm:inline">{roomId}</code>
            <button onClick={copyInviteLink} className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all text-xs font-bold uppercase tracking-wider">
              <Share2 size={16} />
              <span className="hidden lg:inline">Copy Invite Link</span>
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
          <SidebarTabs roomId={roomId} queue={roomData?.queue} />
          <Chat roomId={roomId} username={username} messages={messages} sessionId={sessionId} />
        </div>
      </main>
      <footer className="text-center text-slate-600 text-xs py-4">
        SyncVibe v1.0 • Built with React & Firebase
      </footer>
    </div>
  );
};

export default App;
