export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string | null;
  role?: "organizer" | "attendee" | "admin" | string;
  modelType?: "User" | "Attendee";
  status?: string;
  isCurrentUser?: boolean;
}

export interface ChatRoom {
  _id: string;
  id?: string;
  name: string;
  type: "public" | "private" | "general" | "announcement";
  isGroup: boolean;
  event: string;
  participantIds?: string[];
  participants?: ChatParticipant[];
  otherParticipant?: ChatParticipant;
  displayName?: string;
  unreadCount?: number;
  activeCount?: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  _id: string;
  room: string | { _id: string; name?: string };
  sender: string | { _id: string; id?: string; name: string; firstName?: string; lastName?: string; avatar?: string };
  senderName?: string;
  senderAvatar?: string;
  senderModel?: "User" | "Attendee";
  content: string;
  type: "user_message" | "system_message" | "image" | "file";
  createdAt: string;
  isSending?: boolean;
  error?: boolean;
  clientMsgId?: string;
}

export interface ChatPagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-auth-token"] = token;
  }
  return headers;
};

export const chatService = {
  /**
   * Fetch all accessible rooms for an event (public/group rooms and personal DMs)
   */
  async getRooms(eventId: string, token: string): Promise<ChatRoom[]> {
    const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${eventId}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch rooms: ${res.statusText}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((room) => ({
        ...room,
        id: room._id || room.id,
      }));
    }
    if (data && Array.isArray(data.rooms)) {
      return data.rooms.map((room: any) => ({
        ...room,
        id: room._id || room.id,
      }));
    }
    return [];
  },

  /**
   * Fetch participants directory for an event (Organizer + Confirmed Attendees)
   */
  async getParticipants(
    eventId: string,
    token: string
  ): Promise<{ organizer: ChatParticipant | null; attendees: ChatParticipant[]; totalCount: number }> {
    const res = await fetch(`${API_BASE_URL}/api/chat/participants/${eventId}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch participants: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      organizer: data.organizer || null,
      attendees: Array.isArray(data.attendees) ? data.attendees : [],
      totalCount: data.totalCount || 0,
    };
  },

  /**
   * Get paginated message history for a room
   */
  async getMessages(
    roomId: string,
    token: string,
    page = 1,
    limit = 50
  ): Promise<{ data: ChatMessage[]; pagination: ChatPagination }> {
    const res = await fetch(`${API_BASE_URL}/api/chat/messages/${roomId}?page=${page}&limit=${limit}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to fetch messages: ${res.statusText}`);
    }
    const json = await res.json();

    if (json && Array.isArray(json.data)) {
      return {
        data: json.data,
        pagination: json.pagination || { total: json.data.length, page, pages: 1, limit },
      };
    }

    if (Array.isArray(json)) {
      return {
        data: json,
        pagination: { total: json.length, page: 1, pages: 1, limit },
      };
    }

    if (json && Array.isArray(json.messages)) {
      return {
        data: json.messages,
        pagination: { total: json.messages.length, page: 1, pages: 1, limit },
      };
    }

    return {
      data: [],
      pagination: { total: 0, page: 1, pages: 1, limit },
    };
  },

  /**
   * Send a message to a room via REST
   */
  async sendMessageREST(
    roomId: string,
    content: string,
    token: string,
    senderName?: string,
    senderAvatar?: string,
    type: "user_message" | "system_message" | "image" | "file" = "user_message"
  ): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE_URL}/api/chat/messages/${roomId}`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        content,
        type,
        senderName,
        senderAvatar,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to send message: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Create or fetch an existing 1-on-1 direct message room
   */
  async createDirectRoom(
    eventId: string,
    targetParticipantId: string,
    currentUserId: string,
    token: string,
    targetParticipant?: ChatParticipant
  ): Promise<ChatRoom> {
    const pIds = [currentUserId, targetParticipantId].filter(Boolean);
    const body: Record<string, any> = {
      event: eventId,
      eventId: eventId,
      name: targetParticipant?.name || "Direct Message",
      type: "private",
      isGroup: false,
      participantIds: pIds,
    };

    if (targetParticipant) {
      body.participants = [
        {
          id: targetParticipant.id,
          name: targetParticipant.name,
          avatar: targetParticipant.avatar || null,
          role: targetParticipant.role === "organizer" ? "admin" : "attendee",
          modelType: targetParticipant.modelType || "Attendee",
        },
      ];
    }

    const res = await fetch(`${API_BASE_URL}/api/chat/room`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to create direct room: ${res.statusText}`);
    }

    const room = await res.json();
    return {
      ...room,
      id: room._id || room.id,
      displayName: targetParticipant?.name || room.displayName || room.name,
      otherParticipant: targetParticipant || room.otherParticipant,
    };
  },
};
