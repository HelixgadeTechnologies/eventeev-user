import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/lib/models/ChatRoom";

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    await dbConnect();
    
    // Ensure at least a general lobby exists
    let rooms = await ChatRoom.find({ eventId: params.eventId });
    
    if (rooms.length === 0) {
      const lobby = await ChatRoom.create({
        eventId: params.eventId,
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
