"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send,
  Users,
  Mic,
  Loader2,
  Info,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  Crown,
  Lock,
  Radio,
  Check,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initSocket, disconnectSocket } from "@/lib/socket";
import { chatService, ChatRoom, ChatMessage, ChatParticipant } from "@/lib/services/chatService";
import { NewChatModal } from "@/components/chat/NewChatModal";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Attendee");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [organizer, setOrganizer] = useState<ChatParticipant | null>(null);
  const [initiatingOrganizerChat, setInitiatingOrganizerChat] = useState(false);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number }>({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [activeTab, setActiveTab] = useState<"channels" | "direct">("channels");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [roomPresence, setRoomPresence] = useState<Record<string, number>>({});
  const [unreads, setUnreads] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // Initial Auth & Data Fetch
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedEventId = localStorage.getItem("eventId");
    setToken(storedToken);
    setEventId(storedEventId);

    if (!storedToken || !storedEventId) {
      setLoadingRooms(false);
      return;
    }

    // Immediately resolve identity from token without waiting for network
    const decoded = parseJwt(storedToken);
    const initialUid = decoded?.attendee?.id || decoded?.id || decoded?.user?.id || null;
    const initialName = decoded?.name || decoded?.attendee?.name || decoded?.user?.name || "Attendee";
    if (initialUid) setCurrentUserId(initialUid);
    if (initialName) setCurrentUserName(initialName);

    const socket = initSocket(storedToken);

    const initData = async () => {
      try {
        // Assert attendee check-in status so chat room and directory access is permitted
        chatService.checkInSelf(storedToken).catch(() => {});

        // Fetch User profile, accessible rooms, and event participants/organizer in parallel
        const [userRes, fetchedRooms, participantsData] = await Promise.all([
          fetch("/api/attendee/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          }).catch(() => null),
          chatService.getRooms(storedEventId, storedToken).catch(() => []),
          chatService.getParticipants(storedEventId, storedToken).catch(() => null),
        ]);

        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          const userObj = userData?.user;
          if (userObj) {
            const uid = userObj._id || userObj.id;
            setCurrentUserId(uid);
            setCurrentUserName(
              userObj.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || initialName
            );
            setCurrentUserAvatar(userObj.avatarUrl || userObj.avatar || null);
          }
        }

        if (participantsData?.organizer) {
          setOrganizer(participantsData.organizer);
        }

        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) {
          // Select first room by default
          const initialRoom = fetchedRooms[0];
          setActiveRoomId(initialRoom._id || initialRoom.id || null);
          setActiveTab(initialRoom.isGroup === false || initialRoom.type === "private" ? "direct" : "channels");
        }
      } catch (err) {
        console.error("Initial chat data fetch error:", err);
      } finally {
        setLoadingRooms(false);
      }
    };

    initData();

    // Global room_status listener
    const handleRoomStatus = (status: { activated: boolean; count: number; roomId: string }) => {
      if (status?.roomId) {
        setRoomPresence((prev) => ({
          ...prev,
          [status.roomId]: status.count,
        }));
      }
    };

    socket.on("room_status", handleRoomStatus);

    return () => {
      socket.off("room_status", handleRoomStatus);
      disconnectSocket();
    };
  }, []);

  // Fetch Messages when Active Room Changes
  useEffect(() => {
    if (!activeRoomId || !token) return;

    setLoadingMessages(true);
    let isMounted = true;

    // Reset unread count for this active room
    setUnreads((prev) => ({
      ...prev,
      [activeRoomId]: 0,
    }));

    const loadMessages = async () => {
      try {
        const { data, pagination: pag } = await chatService.getMessages(activeRoomId, token, 1, 50);
        if (isMounted) {
          setMessages(data);
          setPagination({
            page: pag.page,
            pages: pag.pages,
            total: pag.total,
          });
        }
      } catch (err) {
        console.error("Failed to load room messages:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    loadMessages();

    // Socket Room Joining
    const socket = initSocket(token);
    socket.emit("join_room", activeRoomId);

    const handleReceiveMessage = (newMessage: any) => {
      const msgRoomId = typeof newMessage.room === "object" ? newMessage.room?._id : newMessage.room;

      if (msgRoomId === activeRoomIdRef.current) {
        setMessages((prev) => {
          // Deduplicate by _id or clientMsgId
          const exists = prev.some(
            (m) =>
              (newMessage._id && m._id === newMessage._id) ||
              (newMessage.clientMsgId && m.clientMsgId === newMessage.clientMsgId)
          );
          if (exists) {
            return prev.map((m) =>
              (newMessage._id && m._id === newMessage._id) ||
              (newMessage.clientMsgId && m.clientMsgId === newMessage.clientMsgId)
                ? { ...newMessage, isSending: false }
                : m
            );
          }
          return [...prev, newMessage];
        });
      } else if (msgRoomId) {
        // Increment unread count for background room
        setUnreads((prev) => ({
          ...prev,
          [msgRoomId]: (prev[msgRoomId] || 0) + 1,
        }));
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      isMounted = false;
      socket.emit("leave_room", activeRoomId);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [activeRoomId, token]);

  // Auto-scroll to bottom on new messages (unless loading older pages)
  useEffect(() => {
    if (!loadingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMoreMessages]);

  // Load older messages (pagination)
  const handleLoadOlderMessages = async () => {
    if (!activeRoomId || !token || loadingMoreMessages || pagination.page >= pagination.pages) return;

    setLoadingMoreMessages(true);
    const nextPage = pagination.page + 1;
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    try {
      const { data, pagination: pag } = await chatService.getMessages(activeRoomId, token, nextPage, 50);
      setMessages((prev) => {
        // Prepend new older messages and deduplicate
        const existingIds = new Set(prev.map((m) => m._id));
        const filteredNew = data.filter((m) => !existingIds.has(m._id));
        return [...filteredNew, ...prev];
      });
      setPagination({
        page: pag.page,
        pages: pag.pages,
        total: pag.total,
      });

      // Maintain scroll position after prepending
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Active room data
  const activeRoom = useMemo(() => {
    return rooms.find((r) => r._id === activeRoomId || r.id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  const isAnnouncement = activeRoom?.type === "announcement";
  const isDirectMessage = activeRoom?.isGroup === false || activeRoom?.type === "private";

  // Filter channels vs direct messages
  const channelRooms = useMemo(() => {
    return rooms.filter((r) => r.isGroup !== false && r.type !== "private");
  }, [rooms]);

  const directRooms = useMemo(() => {
    return rooms.filter((r) => r.isGroup === false || r.type === "private");
  }, [rooms]);

  const displayedRooms = useMemo(() => {
    const list = activeTab === "channels" ? channelRooms : directRooms;
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((r) => {
      const name = (r.displayName || r.name || "").toLowerCase();
      return name.includes(query);
    });
  }, [activeTab, channelRooms, directRooms, searchQuery]);

  // One-click handler to message or open chat with event organizer
  const handleChatWithOrganizer = async () => {
    const effectiveToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    const effectiveEventId = eventId || (typeof window !== "undefined" ? localStorage.getItem("eventId") : null);
    if (!effectiveEventId || !effectiveToken) return;

    const decoded = parseJwt(effectiveToken);
    const uid = currentUserId || decoded?.attendee?.id || decoded?.id || decoded?.user?.id;
    if (!uid) return;

    // 1. Check if direct room with organizer already exists in current rooms list
    const existingOrgRoom = rooms.find((r) => {
      if (r.isGroup !== false && r.type !== "private") return false;
      const other = r.otherParticipant || (r.participants || []).find((p) => String(p.id) !== String(uid));
      return (
        other?.role === "organizer" ||
        other?.role === "admin" ||
        other?.modelType === "User" ||
        (organizer && String(other?.id) === String(organizer.id))
      );
    });

    if (existingOrgRoom) {
      setActiveTab("direct");
      setActiveRoomId(existingOrgRoom._id || existingOrgRoom.id || null);
      setShowMobileChat(true);
      return;
    }

    // 2. Fetch or create direct room with organizer
    setInitiatingOrganizerChat(true);
    try {
      let targetOrg = organizer;
      if (!targetOrg) {
        const parts = await chatService.getParticipants(effectiveEventId, effectiveToken);
        targetOrg = parts.organizer;
        if (targetOrg) setOrganizer(targetOrg);
      }

      if (!targetOrg) {
        setIsNewChatModalOpen(true);
        return;
      }

      const directRoom = await chatService.createDirectRoom(
        effectiveEventId,
        targetOrg.id,
        uid,
        effectiveToken,
        targetOrg,
        currentUserName,
        currentUserAvatar || undefined
      );

      setRooms((prev) => {
        const exists = prev.find((r) => (r._id || r.id) === (directRoom._id || directRoom.id));
        if (exists) return prev;
        return [directRoom, ...prev];
      });

      setActiveTab("direct");
      setActiveRoomId(directRoom._id || directRoom.id || null);
      setShowMobileChat(true);
    } catch (err) {
      console.error("Failed to initiate chat with organizer:", err);
      setIsNewChatModalOpen(true);
    } finally {
      setInitiatingOrganizerChat(false);
    }
  };

  // Select a participant from NewChatModal to start or open DM
  const handleSelectParticipant = async (participant: ChatParticipant) => {
    const effectiveToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    const effectiveEventId = eventId || (typeof window !== "undefined" ? localStorage.getItem("eventId") : null);
    if (!effectiveEventId || !effectiveToken) return;

    const decoded = parseJwt(effectiveToken);
    const uid = currentUserId || decoded?.attendee?.id || decoded?.id || decoded?.user?.id;
    if (!uid) return;

    try {
      const directRoom = await chatService.createDirectRoom(
        effectiveEventId,
        participant.id,
        uid,
        effectiveToken,
        participant,
        currentUserName,
        currentUserAvatar || undefined
      );

      setRooms((prev) => {
        const exists = prev.find((r) => (r._id || r.id) === (directRoom._id || directRoom.id));
        if (exists) return prev;
        return [directRoom, ...prev];
      });

      setActiveTab("direct");
      setActiveRoomId(directRoom._id || directRoom.id || null);
      setShowMobileChat(true);
    } catch (err) {
      console.error("Failed to initiate direct room:", err);
    }
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoomId || !currentUserId || isAnnouncement) return;

    const messageText = input.trim();
    setInput("");

    const clientMsgId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: ChatMessage = {
      _id: clientMsgId,
      clientMsgId,
      room: activeRoomId,
      sender: {
        _id: currentUserId,
        id: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar || undefined,
      },
      senderName: currentUserName,
      senderAvatar: currentUserAvatar || undefined,
      senderModel: "Attendee",
      content: messageText,
      type: "user_message",
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    // Optimistic UI Update
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const socket = initSocket(token);
      if (socket && socket.connected) {
        socket.emit("send_message", {
          room: activeRoomId,
          sender: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          content: messageText,
          type: "user_message",
          clientMsgId,
        });
      } else {
        // Fallback to REST API if socket is disconnected
        if (token) {
          const sent = await chatService.sendMessageREST(
            activeRoomId,
            messageText,
            token,
            currentUserName,
            currentUserAvatar || undefined
          );
          setMessages((prev) =>
            prev.map((m) => (m.clientMsgId === clientMsgId ? { ...sent, isSending: false } : m))
          );
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) =>
        prev.map((m) => (m.clientMsgId === clientMsgId ? { ...m, isSending: false, error: true } : m))
      );
    }
  };

  // Helper for channel icons
  const getRoomIcon = (room: ChatRoom) => {
    if (room.type === "announcement") {
      return <Megaphone className="w-4 h-4 text-amber-500" />;
    }
    if (room.name.toLowerCase().includes("speaker") || room.name.toLowerCase().includes("q&a")) {
      return <Mic className="w-4 h-4 text-indigo-500" />;
    }
    if (room.isGroup === false || room.type === "private") {
      return <MessageSquare className="w-4 h-4 text-eventeev-orange" />;
    }
    return <Users className="w-4 h-4 text-slate-500" />;
  };

  if (loadingRooms) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
        <p className="text-sm font-semibold text-slate-400">Connecting to event chat...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 h-[calc(100dvh-5rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-eventeev-navy tracking-tight">Event Chat</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Connect in event channels or message fellow attendees and hosts
          </p>
        </div>

        {/* Quick Chat With Organizer Action Button */}
        <button
          onClick={handleChatWithOrganizer}
          disabled={initiatingOrganizerChat}
          className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-eventeev-orange hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {initiatingOrganizerChat ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crown className="w-4 h-4 text-amber-100" />
          )}
          <span>Chat with Organizer</span>
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 bg-white border border-slate-100 rounded-3xl premium-shadow overflow-hidden flex flex-row relative min-h-0">
        {/* ================= LEFT SIDEBAR (CHANNELS & DMS) ================= */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-100 bg-slate-50/40 flex-shrink-0 transition-all",
            showMobileChat ? "hidden md:flex" : "flex"
          )}
        >
          {/* Quick Organizer Direct Chat Banner */}
          <div className="p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border-b border-orange-100 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-eventeev-orange p-0.5 shadow-sm shadow-orange-500/20">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                    {organizer?.avatar ? (
                      <img src={organizer.avatar} alt={organizer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-eventeev-orange">
                        {(organizer?.name || "H").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-eventeev-navy truncate">
                    {organizer?.name || "Event Organizer"}
                  </p>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
                    Host
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Direct support & questions
                </p>
              </div>
            </div>

            <button
              onClick={handleChatWithOrganizer}
              disabled={initiatingOrganizerChat}
              className="px-3 py-1.5 bg-eventeev-orange hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer disabled:opacity-60"
            >
              {initiatingOrganizerChat ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>Chat</span>
            </button>
          </div>

          {/* Tabs: Channels vs Direct Messages */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 bg-white">
            <button
              onClick={() => setActiveTab("channels")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                activeTab === "channels"
                  ? "bg-eventeev-orange text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-100 text-slate-600 hover:text-eventeev-navy"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Channels</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                  activeTab === "channels" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}
              >
                {channelRooms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("direct")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                activeTab === "direct"
                  ? "bg-eventeev-orange text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-100 text-slate-600 hover:text-eventeev-navy"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                  activeTab === "direct" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}
              >
                {directRooms.length}
              </span>
            </button>
          </div>

          {/* Search & New Message Action */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "channels" ? "Search channels..." : "Search messages..."}
                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-xs font-medium text-eventeev-navy placeholder:text-slate-400 focus:outline-none focus:border-eventeev-orange transition-colors"
              />
            </div>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              title="Start a direct conversation"
              className="h-9 px-2.5 bg-orange-50 hover:bg-orange-100 text-eventeev-orange rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* Room / Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {displayedRooms.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">
                  {searchQuery ? "No matches found" : activeTab === "channels" ? "No channels available" : "No direct messages"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {activeTab === "direct" && !searchQuery
                    ? "Have questions about the event schedule, tickets, or venue? Message the organizer directly."
                    : "Rooms created by the event organizer will appear here."}
                </p>
                {activeTab === "direct" && !searchQuery && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <button
                      onClick={handleChatWithOrganizer}
                      disabled={initiatingOrganizerChat}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-eventeev-orange hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {initiatingOrganizerChat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Crown className="w-3.5 h-3.5 text-amber-100" />
                      )}
                      <span>Message Event Organizer</span>
                    </button>
                    <button
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="text-[11px] text-slate-500 hover:text-eventeev-navy font-semibold underline"
                    >
                      or message another attendee
                    </button>
                  </div>
                )}
              </div>
            ) : (
              displayedRooms.map((room) => {
                const isSelected = activeRoomId === room._id || activeRoomId === room.id;
                const unreadCount = unreads[room._id] || 0;
                const activeCount = roomPresence[room._id] || 0;
                const displayName = room.displayName || room.name;
                const other = room.otherParticipant;
                const isHost =
                  other?.role === "organizer" ||
                  other?.role === "admin" ||
                  other?.modelType === "User" ||
                  (organizer && String(other?.id) === String(organizer.id));

                return (
                  <button
                    key={room._id || room.id}
                    onClick={() => {
                      setActiveRoomId(room._id || room.id || null);
                      setShowMobileChat(true);
                    }}
                    className={cn(
                      "w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all relative group",
                      isSelected
                        ? "bg-white border-2 border-eventeev-orange shadow-sm"
                        : "bg-white/60 hover:bg-white border border-transparent hover:border-slate-200"
                    )}
                  >
                    {/* Avatar / Icon */}
                    <div className="relative flex-shrink-0">
                      {room.isGroup === false || room.type === "private" ? (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {other?.avatar ? (
                            <img src={other.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">
                              {(displayName || "U").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center",
                            room.type === "announcement" ? "bg-amber-100" : "bg-slate-100"
                          )}
                        >
                          {getRoomIcon(room)}
                        </div>
                      )}

                      {/* Online presence dot */}
                      {activeCount > 0 && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p
                            className={cn(
                              "text-xs font-bold truncate",
                              isSelected ? "text-eventeev-navy" : "text-slate-700 group-hover:text-eventeev-navy"
                            )}
                          >
                            {displayName}
                          </p>
                          {isHost && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 flex-shrink-0">
                              Host
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-eventeev-orange text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 capitalize truncate">
                          {room.type === "announcement"
                            ? "Announcement Channel"
                            : isHost
                            ? "Organizer Direct Message"
                            : room.isGroup === false
                            ? "Direct Message"
                            : "Channel"}
                        </span>
                        {activeCount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {activeCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT MAIN CHAT AREA ================= */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white min-w-0 h-full",
            !showMobileChat ? "hidden md:flex" : "flex"
          )}
        >
          {!activeRoomId || !activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-eventeev-orange mb-4 shadow-sm shadow-orange-500/10">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-eventeev-navy mb-1">Select a Conversation</h3>
              <p className="text-slate-500 font-medium text-xs max-w-sm mb-5">
                Join live event channels or message fellow attendees and the event organizer directly.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={handleChatWithOrganizer}
                  disabled={initiatingOrganizerChat}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-eventeev-orange hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {initiatingOrganizerChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4 text-amber-100" />
                  )}
                  <span>Message Host ({organizer?.name || "Organizer"})</span>
                </button>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Browse Attendees
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Room Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:text-eventeev-navy"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {getRoomIcon(activeRoom)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-eventeev-navy truncate">
                        {activeRoom.displayName || activeRoom.name}
                      </h2>
                      {isAnnouncement && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Megaphone className="w-3 h-3 text-amber-600" />
                          Announcements
                        </span>
                      )}
                      {(activeRoom.otherParticipant?.role === "organizer" ||
                        activeRoom.otherParticipant?.role === "admin" ||
                        activeRoom.otherParticipant?.modelType === "User" ||
                        (organizer && String(activeRoom.otherParticipant?.id) === String(organizer.id))) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-200/60 flex items-center gap-1 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-600" />
                          Host · Organizer
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      {isAnnouncement ? (
                        <span>Read-only announcements from event organizer</span>
                      ) : activeRoom.isGroup === false &&
                        (activeRoom.otherParticipant?.role === "organizer" ||
                          activeRoom.otherParticipant?.role === "admin" ||
                          activeRoom.otherParticipant?.modelType === "User" ||
                          (organizer && String(activeRoom.otherParticipant?.id) === String(organizer.id))) ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          Official Event Host · Direct Support
                        </span>
                      ) : activeRoom.isGroup === false ? (
                        <span>Direct conversation</span>
                      ) : (
                        <span>Open public channel</span>
                      )}
                      {(roomPresence[activeRoom._id] || 0) > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" />
                            {roomPresence[activeRoom._id]} online
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Announcement Channel Notice Banner */}
              {isAnnouncement && (
                <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium flex-shrink-0">
                  <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Announcement Channel:</strong> Only event organizers can broadcast messages here. Check back
                    for official updates.
                  </span>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0 bg-slate-50/30">
                {/* Pagination: Load older messages button */}
                {pagination.page < pagination.pages && (
                  <div className="text-center pb-2">
                    <button
                      onClick={handleLoadOlderMessages}
                      disabled={loadingMoreMessages}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-eventeev-navy hover:border-slate-300 transition-all shadow-xs disabled:opacity-60"
                    >
                      {loadingMoreMessages ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-eventeev-orange" />
                          Loading earlier messages...
                        </span>
                      ) : (
                        "Load earlier messages"
                      )}
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-eventeev-orange" />
                    <p className="text-xs font-semibold text-slate-400">Loading conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      {getRoomIcon(activeRoom)}
                    </div>
                    <p className="text-sm font-bold text-eventeev-navy">No messages yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {isAnnouncement
                        ? "The host has not posted any announcements yet."
                        : "Say hello to start the conversation!"}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderId =
                      typeof msg.sender === "object"
                        ? msg.sender?._id || msg.sender?.id
                        : msg.sender;
                    const isMe = String(senderId) === String(currentUserId);
                    const senderName =
                      msg.senderName ||
                      (typeof msg.sender === "object"
                        ? msg.sender?.name ||
                          `${msg.sender?.firstName || ""} ${msg.sender?.lastName || ""}`.trim()
                        : "Attendee");
                    const senderAvatar =
                      msg.senderAvatar || (typeof msg.sender === "object" ? msg.sender?.avatar : null);

                    const isHostSender =
                      msg.senderModel === "User" ||
                      senderName.toLowerCase().includes("organizer") ||
                      senderName.toLowerCase().includes("host");

                    return (
                      <div
                        key={msg._id || msg.clientMsgId || i}
                        className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "flex items-end gap-2 max-w-[85%] sm:max-w-[70%]",
                            isMe ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                              {senderAvatar ? (
                                <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[11px] font-bold text-slate-600">
                                  {(senderName || "A").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}

                          <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            {!isMe && (
                              <div className="flex items-center gap-1.5 ml-1 mb-1">
                                <span className="text-[11px] font-bold text-slate-600">{senderName}</span>
                                {isHostSender && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                    Host
                                  </span>
                                )}
                              </div>
                            )}

                            <div
                              className={cn(
                                "px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-xs",
                                isMe
                                  ? "bg-eventeev-orange text-white rounded-br-xs"
                                  : isHostSender
                                  ? "bg-white border-2 border-amber-300 text-eventeev-navy rounded-bl-xs"
                                  : "bg-white border border-slate-100 text-eventeev-navy rounded-bl-xs"
                              )}
                            >
                              {msg.content}
                            </div>

                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Just now"}
                              </span>
                              {isMe && (
                                <span className="text-slate-400">
                                  {msg.isSending ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin text-eventeev-orange" />
                                  ) : msg.error ? (
                                    <span className="text-rose-500 text-[10px] font-bold">Failed</span>
                                  ) : (
                                    <CheckCheck className="w-3 h-3 text-emerald-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex-shrink-0">
                {isAnnouncement ? (
                  <div className="h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 px-4">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Only event organizers can send messages in this channel</span>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${activeRoom.displayName || activeRoom.name}...`}
                      className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs sm:text-sm font-medium text-eventeev-navy placeholder:text-slate-400 focus:outline-none focus:border-eventeev-orange transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="h-12 w-12 bg-eventeev-orange hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-eventeev-orange active:scale-95 transition-all rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 flex-shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Direct Message Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        eventId={eventId || ""}
        currentUserId={currentUserId}
        token={token}
        onSelectParticipant={handleSelectParticipant}
      />
    </div>
  );
}
