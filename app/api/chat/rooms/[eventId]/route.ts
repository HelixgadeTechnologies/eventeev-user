import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/lib/models/ChatRoom";
import mongoose from "mongoose";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    await dbConnect();
    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ rooms: [] });
    }

    const authHeader = req.headers.get("authorization");
    const xAuthToken = req.headers.get("x-auth-token");
    const token =
      xAuthToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader);

    let currentUserId: string | null = null;
    if (token) {
      const decoded = decodeJwtPayload(token);
      currentUserId =
        decoded?.attendee?.id ||
        decoded?.attendee?._id ||
        decoded?.id ||
        decoded?._id ||
        decoded?.user?.id ||
        decoded?.user?._id ||
        null;
    }

    const eventObjId = mongoose.Types.ObjectId.isValid(eventId)
      ? new mongoose.Types.ObjectId(eventId)
      : null;

    const eventConditions: any[] = [{ event: eventId }, { eventId }];
    if (eventObjId) {
      eventConditions.push({ event: eventObjId }, { eventId: eventObjId });
    }

    const roomQuery: any = {
      $or: eventConditions,
    };

    if (currentUserId) {
      roomQuery.$and = [
        {
          $or: [
            { type: { $in: ["public", "general", "announcement"] } },
            { isGroup: true },
            { participantIds: String(currentUserId) },
          ],
        },
      ];
    } else {
      roomQuery.$and = [
        {
          $or: [
            { type: { $in: ["public", "general", "announcement"] } },
            { isGroup: true },
          ],
        },
      ];
    }

    let rooms = await ChatRoom.find(roomQuery).lean();

    // Ensure at least a general lobby exists if no rooms found
    if (rooms.length === 0) {
      const lobby = await ChatRoom.create({
        event: eventObjId || eventId,
        eventId: eventObjId || eventId,
        name: "General Lobby",
        type: "public",
        isGroup: true,
      });
      rooms = [lobby.toObject ? lobby.toObject() : lobby];
    }

    const mappedRooms = rooms.map((r: any) => ({
      ...r,
      _id: String(r._id),
      id: String(r._id),
      event: String(r.event || eventId),
      eventId: String(r.eventId || eventId),
    }));

    return NextResponse.json({ rooms: mappedRooms });
  } catch (error) {
    console.error("Chat Rooms Fetch Error:", error);
    return NextResponse.json({ rooms: [] });
  }
}
