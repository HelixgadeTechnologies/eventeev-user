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

    // Clean the eventId by removing any accidental spaces
    const cleanEventId = eventId.trim();
    
    // Validate that we have some ID
    if (!cleanEventId) {
      return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    }

    // Log what we are searching for
    console.log("Searching for Event ID:", cleanEventId);

    // We search by slug, title or _id
    const event = await Event.findOne({
      $or: [
        { slug: new RegExp(`^${cleanEventId}$`, 'i') },
        { connectCode: new RegExp(`^${cleanEventId}$`, 'i') },
        { title: new RegExp(`^${cleanEventId}$`, 'i') },
        ...(mongoose.isValidObjectId(cleanEventId) ? [{ _id: cleanEventId }] : [])
      ]
    });
    
    if (!event) {
      console.log("Event not found for eventId:", eventId);
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
