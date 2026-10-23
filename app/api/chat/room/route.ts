import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/lib/models/ChatRoom";
import { verifyToken } from "@/lib/jwt";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

/**
 * POST /api/chat/room
 *
 * Find-or-create a chat room (typically a private DM).
 * Creates the room directly in MongoDB so no upstream organizer token is needed.
 * Falls back to proxying the upstream if MONGODB_URI is unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const xAuthToken = req.headers.get("x-auth-token");
    const token =
      xAuthToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader);

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify the attendee JWT using the shared secret
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Token is not valid" }, { status: 401 });
    }

    const body = await req.json();
    const {
      event,
      eventId,
      name,
      type = "private",
      isGroup = false,
      participantIds = [],
      participants = [],
      leadParticipant,
    } = body;

    const resolvedEventId = event || eventId;
    if (!resolvedEventId) {
      return NextResponse.json({ message: "eventId is required" }, { status: 400 });
    }

    // ── Direct MongoDB path ──────────────────────────────────────────────────
    if (process.env.MONGODB_URI) {
      await dbConnect();

      // For DM rooms, find an existing room with the same pair of participants
      let existingRoom = null;
      if (!isGroup && participantIds.length === 2) {
        existingRoom = await (ChatRoom as any).findOne({
          $or: [{ eventId: resolvedEventId }, { event: resolvedEventId }],
          type: "private",
          isGroup: false,
          participantIds: { $all: participantIds, $size: 2 },
        });
      }

      if (existingRoom) {
        const room = existingRoom.toObject();
        return NextResponse.json({
          ...room,
          _id: String(room._id),
          id: String(room._id),
          event: resolvedEventId,
          eventId: resolvedEventId,
          // Enrich otherParticipant from participants list
          otherParticipant:
            participants.find(
              (p: any) =>
                String(p.id) !==
                String(decoded?.attendee?.id || decoded?.id || decoded?.user?.id)
            ) || null,
        });
      }

      // Create new room
      const newRoom = await (ChatRoom as any).create({
        eventId: resolvedEventId,
        event: resolvedEventId,
        name: name || "Direct Message",
        type,
        isGroup,
        participantIds,
        participants,
        ...(leadParticipant ? { leadParticipant } : {}),
      });

      const room = newRoom.toObject();
      const currentUserId = decoded?.attendee?.id || decoded?.id || decoded?.user?.id;
      return NextResponse.json(
        {
          ...room,
          _id: String(room._id),
          id: String(room._id),
          event: resolvedEventId,
          eventId: resolvedEventId,
          otherParticipant:
            participants.find((p: any) => String(p.id) !== String(currentUserId)) || null,
        },
        { status: 201 }
      );
    }

    // ── Upstream proxy fallback (when no MONGODB_URI) ────────────────────────
    const upstreamRes = await fetch(`${API_BASE_URL}/api/chat/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-auth-token": token,
      },
      body: JSON.stringify(body),
    });

    const data = await upstreamRes.json().catch(() => null);
    return NextResponse.json(
      data ?? { message: `Upstream error: ${upstreamRes.statusText}` },
      { status: upstreamRes.status }
    );
  } catch (error) {
    console.error("Chat Room POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
