"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Plus, UserCircle2, Mic, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_MESSAGES = [
  { id: 1, sender: "Sarah Chen", content: "Great keynote this morning!", time: "10:15 AM", isMe: false },
  { id: 2, sender: "You", content: "Absolutely, the part about AI ethics was mind-blowing.", time: "10:16 AM", isMe: true },
  { id: 3, sender: "Marcus Thorne", content: "Don't forget the networking mixer at 5!", time: "10:20 AM", isMe: false },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "You",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-24 px-6 glass border-b border-white/20 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-eventeev-orange/10 rounded-2xl flex items-center justify-center text-eventeev-orange premium-shadow">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">Event Pulse Chat</h1>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              1,240 Attendees Online
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {!msg.isMe && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {msg.sender}
                </span>
              )}
              <div className={cn(
                "px-5 py-4 rounded-[2rem]",
                msg.isMe 
                  ? "bg-eventeev-navy text-white rounded-tr-none shadow-xl" 
                  : "bg-slate-100 text-eventeev-navy rounded-tl-none"
              )}>
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              </div>
              <span className="text-[9px] font-bold text-slate-300 mt-2 px-2">
                {msg.time}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 pb-28">
        <form 
          onSubmit={handleSend}
          className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-eventeev-orange transition-all duration-300"
        >
          <button type="button" className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <Plus className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-eventeev-navy placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
              input.trim() ? "bg-eventeev-orange text-white shadow-lg" : "text-slate-300"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
