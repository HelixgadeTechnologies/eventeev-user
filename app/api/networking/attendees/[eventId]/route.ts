import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ticket from "@/lib/models/Ticket";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { eventId } = await params;
    
    // Find all valid tickets for this event
    const tickets = await Ticket.find({ eventId, status: 'valid' })
      .populate({ path: 'attendeeId', model: Attendee, select: 'name email avatarUrl' });

    // Filter out the current user
    const attendees = tickets
      .map((t: any) => t.attendeeId)
      .filter((a: any) => a && a._id.toString() !== decoded.id);

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error("Networking Attendees Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
