import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, orderId } = await req.json();

    if (!email || !orderId) {
      return NextResponse.json({ error: "Email and orderId are required" }, { status: 400 });
    }

    const attendee = await Attendee.findOne({ email });
    if (!attendee) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify orderId matches a ticket for this attendee
    const ticket = await Ticket.findOne({ attendeeId: attendee._id, orderId });
    if (!ticket) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ id: attendee._id, email: attendee.email });

    return NextResponse.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
