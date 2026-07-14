import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/lib/models/ChatRoom";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    await dbConnect();
    const { eventId } = await params;
    
    // Ensure at least a general lobby exists
    let rooms = await ChatRoom.find({ eventId });
    
    if (rooms.length === 0) {
      const lobby = await ChatRoom.create({
        eventId,
        name: "General Lobby",
        type: "public"
      });
      rooms = [lobby];
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Chat Rooms Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
