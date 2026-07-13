import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const tickets = await Ticket.find({ attendeeId: decoded.id }).populate({
      path: 'eventId',
      model: Event
    });

    const events = tickets.map(t => ({
      ticketId: t._id,
      orderId: t.orderId,
      tier: t.tier,
      status: t.status,
      event: t.eventId
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("My Events Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
