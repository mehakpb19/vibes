import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, db, ref, onValue, update, toggleReaction } from '../firebase';
import { Send, MessageSquare, Plus } from 'lucide-react';

interface ChatProps {
  roomId: string;
  username: string;
  messages: any[];
  sessionId: string;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥'];
const ALL_EMOJIS = [
  // Smileys & Emotion
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤',
  // Hand gestures
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄',
  // Animals & Nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃',
  // Food & Drink
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕', '🍵', '🧉', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥤', '🧃', '🧉',
  // Activities
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸️', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🔮', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🧶',
  // Objects
  '⌚', '📱', '📲', '💻', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📁', '📂', '📅', '📆', '🗓️', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🗿'
];

const Chat: React.FC<ChatProps> = ({ roomId, username, messages, sessionId }) => {
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setActiveEmojiPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Listen for typing users
  useEffect(() => {
    const usersRef = ref(db, `rooms/${roomId}/users`);
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      if (users) {
        const typing = Object.entries(users)
          .filter(([id, data]: [string, any]) => id !== sessionId && data.isTyping)
          .map(([_, data]: [string, any]) => data.username);
        setTypingUsers(typing);
      } else {
        setTypingUsers([]);
      }
    });

    return () => unsubscribe();
  }, [roomId, sessionId]);

  const updateTypingStatus = (isTyping: boolean) => {
    const userRef = ref(db, `rooms/${roomId}/users/${sessionId}`);
    update(userRef, { isTyping });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Update typing status
    updateTypingStatus(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(roomId, {
        user: username,
        text: input.trim(),
      });
      setInput('');
      updateTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleReaction = (messageId: string, messageUser: string, emoji: string) => {
    // Disable reaction on own messages
    if (messageUser === username) return;
    toggleReaction(roomId, messageId, username, emoji);
  };

  const renderReactions = (reactions: any, messageId: string, messageUser: string) => {
    if (!reactions) return null;
    
    const reactionCounts: Record<string, number> = {};
    Object.values(reactions).forEach((emoji: any) => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <div 
            key={emoji} 
            className={`flex items-center bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] transition-colors border border-white/5 ${
              messageUser !== username ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={() => {
              if (messageUser !== username) {
                handleReaction(messageId, messageUser, emoji);
              }
            }}
          >
            <span>{emoji}</span>
            <span className="ml-1 text-slate-400">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[400px] w-full lg:w-80 glass rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <MessageSquare size={18} className="text-indigo-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-300">Room Chat</h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
            <MessageSquare size={32} className="mb-2" />
            <p className="text-xs italic">No messages yet.<br/>Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div 
            key={msg.id || i} 
            className={`flex flex-col ${msg.user === username ? 'items-end' : 'items-start'} relative group`}
            onMouseEnter={() => msg.user !== username && setHoveredMessage(msg.id)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1 mr-1 uppercase tracking-tighter">{msg.user}</span>
            <div className="relative max-w-[85%]">
              <div 
                onDoubleClick={() => handleReaction(msg.id, msg.user, '❤️')}
                className={`px-4 py-2 rounded-2xl text-sm shadow-sm transition-transform active:scale-[0.98] ${
                  msg.user === username ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none cursor-pointer'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Emoji Picker on Hover (only for others' messages) */}
              {hoveredMessage === msg.id && msg.user !== username && (
                <div className={`absolute -top-8 ${msg.user === username ? 'right-0' : 'left-0'} flex items-center gap-1 bg-[#1a1a1e] border border-white/10 p-1 rounded-full shadow-xl z-10 animate-in fade-in zoom-in duration-200`}>
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msg.id, msg.user, emoji)}
                      className="hover:scale-125 transition-transform px-1 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                  <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                  <button 
                    className={`p-1 hover:bg-white/5 rounded-full transition-colors ${activeEmojiPicker === msg.id ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEmojiPicker(activeEmojiPicker === msg.id ? null : msg.id);
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}

              {/* Full Emoji Picker Tab */}
              {activeEmojiPicker === msg.id && (
                <div 
                  ref={pickerRef}
                  className={`absolute -top-48 ${msg.user === username ? 'right-0' : 'left-0'} w-56 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200`}
                >
                  <div className="h-40 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-6 gap-1">
                      {ALL_EMOJIS.map((emoji, index) => (
                        <button
                          key={`${emoji}-${index}`}
                          onClick={() => {
                            handleReaction(msg.id, msg.user, emoji);
                            setActiveEmojiPicker(null);
                          }}
                          className="hover:bg-white/10 p-1.5 rounded-lg transition-all text-lg hover:scale-120 active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {renderReactions(msg.reactions, msg.id, msg.user)}
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-indigo-400/60 animate-pulse ml-1">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
