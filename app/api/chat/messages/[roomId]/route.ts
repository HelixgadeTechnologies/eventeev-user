import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    await dbConnect();
    const messages = await ChatMessage.find({ roomId: params.roomId })
      .sort({ createdAt: 1 })
      .populate({ path: 'senderId', model: Attendee, select: 'name avatarUrl' });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat Messages Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { content } = await req.json();

    if (!content) return NextResponse.json({ error: "Message content required" }, { status: 400 });

    const message = await ChatMessage.create({
      roomId: params.roomId,
      senderId: decoded.id,
      content
    });

    const populatedMessage = await message.populate({ path: 'senderId', model: Attendee, select: 'name avatarUrl' });

    return NextResponse.json({ message: populatedMessage });
  } catch (error) {
    console.error("Chat Message Send Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
