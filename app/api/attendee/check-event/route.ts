import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import { signToken } from "@/lib/jwt";

/**
 * GET /api/attendee/check-event?email=...&eventId=...
 *
 * Checks whether an attendee already has a valid or used ticket
 * for the given event. If so, returns a fresh JWT so they can
 * skip the payment flow and go straight to the dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const eventId = searchParams.get("eventId");

    if (!email || !eventId) {
      return NextResponse.json({ error: "email and eventId are required" }, { status: 400 });
    }

    // Find the attendee by email
    const attendee = await Attendee.findOne({ email: email.toLowerCase().trim() });
    if (!attendee) {
      return NextResponse.json({ isAttendee: false });
    }

    // Check if they have a non-cancelled ticket for this event
    const ticket = await Ticket.findOne({
      attendeeId: attendee._id,
      eventId,
      status: { $in: ["valid", "used", "pending"] },
    });

    if (!ticket) {
      return NextResponse.json({ isAttendee: false });
    }

    // Already registered — issue a fresh token and let them in
    const token = signToken({ id: attendee._id.toString(), email: attendee.email });

    return NextResponse.json({
      isAttendee: true,
      token,
      eventId: ticket.eventId.toString(),
    });
  } catch (error) {
    console.error("Check-event Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
