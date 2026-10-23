import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await dbConnect();
    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json({ data: [], messages: [] });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const roomObjId = mongoose.Types.ObjectId.isValid(roomId)
      ? new mongoose.Types.ObjectId(roomId)
      : null;

    const roomConditions: any[] = [{ room: roomId }, { roomId: roomId }];
    if (roomObjId) {
      roomConditions.push({ room: roomObjId }, { roomId: roomObjId });
    }

    const filter = { $or: roomConditions };

    const total = await ChatMessage.countDocuments(filter);
    const rawMessages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const messages = rawMessages.map((m: any) => ({
      ...m,
      _id: String(m._id),
      id: String(m._id),
      room: String(m.room || m.roomId || roomId),
      sender:
        typeof m.sender === "object" && m.sender !== null
          ? m.sender
          : {
              _id: String(m.sender || m.senderId || ""),
              id: String(m.sender || m.senderId || ""),
              name: m.senderName || "Attendee",
              avatar: m.senderAvatar || null,
            },
      senderName: m.senderName || "Attendee",
      senderAvatar: m.senderAvatar || null,
      senderModel: m.senderModel || "Attendee",
      content: m.content,
      type: m.type || "user_message",
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      data: messages,
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (error) {
    console.error("Chat Messages Fetch Error:", error);
    return NextResponse.json({ data: [], messages: [] }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const xAuthToken = req.headers.get("x-auth-token");
    const token =
      xAuthToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader);

    let senderId: any = null;
    let senderName = "Attendee";
    let senderAvatar: string | null = null;

    if (token) {
      const decoded: any = decodeJwtPayload(token);
      senderId =
        decoded?.attendee?.id ||
        decoded?.attendee?._id ||
        decoded?.id ||
        decoded?._id ||
        decoded?.user?.id ||
        decoded?.user?._id ||
        null;
      senderName = decoded?.name || decoded?.attendee?.name || decoded?.user?.name || "Attendee";
      senderAvatar = decoded?.avatar || decoded?.attendee?.avatarUrl || decoded?.user?.avatar || null;
    }

    const { roomId } = await params;
    const body = await req.json();
    const { content, type = "user_message" } = body;

    if (!content) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    await dbConnect();

    const roomObjId = mongoose.Types.ObjectId.isValid(roomId)
      ? new mongoose.Types.ObjectId(roomId)
      : roomId;

    const senderObjId =
      senderId && mongoose.Types.ObjectId.isValid(senderId)
        ? new mongoose.Types.ObjectId(senderId)
        : senderId;

    const created = await ChatMessage.create({
      room: roomObjId,
      roomId: roomObjId,
      sender: senderObjId,
      senderId: senderObjId,
      senderName: body.senderName || senderName,
      senderAvatar: body.senderAvatar || senderAvatar,
      senderModel: "Attendee",
      content,
      type,
    });

    const m = (created as any).toObject ? (created as any).toObject() : created;

    return NextResponse.json(
      {
        ...m,
        _id: String(m._id),
        id: String(m._id),
        room: String(m.room || roomId),
        sender: {
          _id: String(senderId || ""),
          id: String(senderId || ""),
          name: m.senderName || senderName,
          avatar: m.senderAvatar || senderAvatar,
        },
        senderName: m.senderName || senderName,
        senderAvatar: m.senderAvatar || senderAvatar,
        senderModel: m.senderModel || "Attendee",
        content: m.content,
        type: m.type || "user_message",
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Chat Message Send Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
