import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../firebase';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
  roomId: string;
  username: string;
  messages: any[];
}

const Chat: React.FC<ChatProps> = ({ roomId, username, messages }) => {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(roomId, {
        user: username,
        text: input.trim(),
      });
      setInput('');
    }
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
          <div key={i} className={`flex flex-col ${msg.user === username ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1 mr-1 uppercase tracking-tighter">{msg.user}</span>
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
              msg.user === username ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
