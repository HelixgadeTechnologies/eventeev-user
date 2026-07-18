"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Users, Mic, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { initSocket, disconnectSocket } from "@/lib/socket";

export default function ChatPage() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<{ id: string, name: string, type: string }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        const eventId = localStorage.getItem("eventId");
        if (!token || !eventId) return;

        // Fetch User
        const userRes = await fetch("/api/attendee/me", { headers: { Authorization: `Bearer ${token}` } });
        const userData = await userRes.json();
        if (userData?.user?._id) setCurrentUserId(userData.user._id);

        // Fetch Rooms
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
        const res = await fetch(`${API_URL}/api/chat/rooms/${eventId}`, {
          headers: { "x-auth-token": token }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
             setRooms(data.map((r: any) => ({ id: r._id, name: r.name, type: r.type })));
             if (data.length > 0) setActiveRoomId(data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    
    return () => {
      disconnectSocket();
    };
  }, []);

  // Fetch Messages when room changes
  useEffect(() => {
    if (!activeRoomId) return;
    
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
        const res = await fetch(`${API_URL}/api/chat/messages/${activeRoomId}`, {
          headers: { "x-auth-token": token }
        });
        if (res.ok) {
          const result = await res.json();
          if (result && Array.isArray(result.data)) {
            setMessages(result.data);
          } else if (Array.isArray(result)) {
            setMessages(result);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchMessages();
    
    const socket = initSocket();
    socket.emit("join_room", activeRoomId);

    const messageHandler = (newMessage: any) => {
      if (newMessage.room === activeRoomId || newMessage.room._id === activeRoomId) {
        setMessages(prev => {
          // Prevent duplicates if backend emits multiple times or it's already in state
          if (prev.find(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
    };
    
    socket.on("receive_message", messageHandler);

    return () => {
      socket.emit("leave_room", activeRoomId);
      socket.off("receive_message", messageHandler);
    };
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoomId || !currentUserId) return;

    const socket = initSocket();
    const newMsg = {
      room: activeRoomId,
      sender: currentUserId,
      content: input,
      type: "user_message"
    };

    socket.emit("send_message", newMsg);
    setInput("");
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-2rem)] p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-black text-eventeev-navy">Event Chat</h1>
        
        {rooms.length > 0 ? (
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center overflow-x-auto no-scrollbar">
            {rooms.map(room => (
              <button 
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap",
                  activeRoomId === room.id ? "bg-white text-eventeev-navy shadow-sm" : "text-slate-500 hover:text-eventeev-navy"
                )}
              >
                {room.name.toLowerCase().includes('speaker') ? <Mic className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {room.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 font-medium">No rooms available</p>
        )}
      </div>

      <div className="flex-1 bg-white border border-slate-100 rounded-3xl premium-shadow flex flex-col overflow-hidden relative">
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Info className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-eventeev-navy mb-2">No Chat Rooms</h3>
            <p className="text-slate-500 font-medium text-sm max-w-md">
              The organizer hasn't created any chat rooms for this event yet. Check back later!
            </p>
          </div>
        ) : (
          <>
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeRoom?.name.toLowerCase().includes('speaker') ? <Mic className="w-8 h-8 text-slate-300" /> : <Users className="w-8 h-8 text-slate-300" />}
                </div>
                <p className="text-slate-500 font-medium text-sm">
                  Welcome to the {activeRoom?.name} room.
                  <br /> Say hello to others!
                </p>
              </div>

              {messages.map((msg, i) => {
                const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                const senderName = msg.sender?.name || 'Unknown User';
                
                return (
                  <div key={msg._id || i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {msg.sender?.avatar ? (
                            <img src={msg.sender.avatar} alt={senderName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{senderName.charAt(0)}</span>
                          )}
                        </div>
                      )}
                      <div>
                        {!isMe && <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1 block">{senderName}</span>}
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-medium",
                          isMe 
                            ? "bg-eventeev-orange text-white rounded-br-sm" 
                            : "bg-slate-100 text-eventeev-navy rounded-bl-sm"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 mt-1 block px-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-100">
              <form onSubmit={handleSend} className="relative flex items-center gap-2 md:gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-12 md:h-14 bg-white border border-slate-200 rounded-xl md:rounded-2xl px-4 md:px-6 focus:outline-none focus:border-eventeev-orange transition-colors font-medium text-eventeev-navy placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="h-12 w-12 md:h-14 md:w-14 bg-eventeev-orange hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-eventeev-orange active:scale-95 transition-all rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 flex-shrink-0"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
