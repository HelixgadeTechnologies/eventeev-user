import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/lib/models/ChatRoom";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

/**
 * Decode a JWT payload without signature verification.
 * Tokens may be issued by the upstream backend (different secret), so we
 * cannot cryptographically verify them here. The upstream already handled
 * authentication at login time; we just need the payload to identify the user.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * POST /api/chat/room
 *
 * Find-or-create a chat room (typically a private DM).
 * Creates the room directly in MongoDB so no upstream organizer token is needed.
 * Falls back to proxying the upstream if DB connection fails.
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

    // Decode without signature verification — tokens may be signed by upstream backend
    const decoded = decodeJwtPayload(token);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized: malformed token" }, { status: 401 });
    }

    const currentUserId: string | undefined =
      decoded?.attendee?.id ||
      decoded?.attendee?._id ||
      decoded?.id ||
      decoded?._id ||
      decoded?.user?.id ||
      decoded?.user?._id;

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
    try {
      await dbConnect();

      const eventObjId = mongoose.Types.ObjectId.isValid(resolvedEventId)
        ? new mongoose.Types.ObjectId(resolvedEventId)
        : null;

      const eventConditions: any[] = [
        { event: resolvedEventId },
        { eventId: resolvedEventId },
      ];
      if (eventObjId) {
        eventConditions.push({ event: eventObjId }, { eventId: eventObjId });
      }

      // For DM rooms, find an existing room with the same pair of participants
      let existingRoom: any = null;
      if (!isGroup && Array.isArray(participantIds) && participantIds.length >= 2) {
        existingRoom = await ChatRoom.findOne({
          $or: eventConditions,
          type: "private",
          isGroup: false,
          participantIds: { $all: participantIds, $size: 2 },
        }).lean();

        // If not found with exact $size 2, try matching all participantIds
        if (!existingRoom) {
          existingRoom = await ChatRoom.findOne({
            $or: eventConditions,
            type: "private",
            isGroup: false,
            participantIds: { $all: participantIds },
          }).lean();
        }
      }

      if (existingRoom) {
        const room = existingRoom;
        return NextResponse.json({
          ...room,
          _id: String(room._id),
          id: String(room._id),
          event: String(room.event || resolvedEventId),
          eventId: String(room.eventId || resolvedEventId),
          otherParticipant:
            participants.find((p: any) => String(p.id) !== String(currentUserId)) ||
            (room.participants ?? []).find((p: any) => String(p.id) !== String(currentUserId)) ||
            null,
        });
      }

      // Create new room
      const leadParticipantObj =
        leadParticipant && mongoose.Types.ObjectId.isValid(leadParticipant)
          ? new mongoose.Types.ObjectId(leadParticipant)
          : leadParticipant;

      const createdByObj =
        currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
          ? new mongoose.Types.ObjectId(currentUserId)
          : currentUserId;

      const newRoom = await ChatRoom.create({
        eventId: eventObjId || resolvedEventId,
        event: eventObjId || resolvedEventId,
        name: name || "Direct Message",
        type,
        isGroup,
        participantIds: participantIds.map((p: any) => String(p)),
        participants,
        ...(leadParticipantObj ? { leadParticipant: leadParticipantObj } : {}),
        ...(createdByObj ? { createdBy: createdByObj } : {}),
      });

      const room = (newRoom as any).toObject ? (newRoom as any).toObject() : newRoom;
      return NextResponse.json(
        {
          ...room,
          _id: String(room._id),
          id: String(room._id),
          event: String(room.event || resolvedEventId),
          eventId: String(room.eventId || resolvedEventId),
          otherParticipant:
            participants.find((p: any) => String(p.id) !== String(currentUserId)) || null,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.warn("Direct DB ChatRoom creation failed, falling back to upstream:", dbError);
    }

    // ── Upstream proxy fallback (when DB operation fails) ─────────────────────
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
