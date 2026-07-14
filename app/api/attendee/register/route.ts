import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Event from "@/lib/models/Event";
import Ticket from "@/lib/models/Ticket";
import { signToken } from "@/lib/jwt";
import crypto from "crypto";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, eventId } = await req.json();

    if (!name || !email || !eventId) {
      return NextResponse.json({ error: "Name, email, and eventId are required" }, { status: 400 });
    }

    const isValidId = mongoose.isValidObjectId(eventId);
    const objectId = isValidId ? new mongoose.Types.ObjectId(eventId) : null;
    
    // Since eventId might be a short code (slug) or an ObjectId, we search by slug (case-insensitive) or _id
    const event = await Event.findOne({
      $or: [
        { slug: new RegExp(`^${eventId}$`, 'i') },
        ...(objectId ? [{ _id: objectId }] : [])
      ]
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found. Please check your code." }, { status: 404 });
    }

    let attendee = await Attendee.findOne({ email });

    if (!attendee) {
      attendee = await Attendee.create({ name, email });
    }

    // Connect the user to the event by creating a Ticket
    // Generate a random orderId for free events or initial registration
    const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    
    // Check if user is already registered for this event
    const existingTicket = await Ticket.findOne({ attendeeId: attendee._id, eventId: event._id });
    if (!existingTicket) {
      await Ticket.create({
        attendeeId: attendee._id,
        eventId: event._id,
        orderId,
        tier: "General Admission", // Default or you can pass it in req.json()
      });
    }

    const token = signToken({ id: attendee._id, email: attendee.email });

    return NextResponse.json({ message: "Registered successfully", attendee, token, event });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
