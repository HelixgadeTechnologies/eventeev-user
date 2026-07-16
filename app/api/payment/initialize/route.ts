import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import crypto from "crypto";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // TEMPORARY FIX: Drop the problematic orderId index from the attendees collection
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('attendees').dropIndex('orderId_1');
      }
    } catch (e: any) {}

    const { eventId, name, email, ticketTier, amount } = await req.json();

    if (!eventId || !name || !email || !ticketTier || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Find or create Attendee
    let attendee = await Attendee.findOne({ email });
    if (!attendee) {
      attendee = await Attendee.create({ name, email });
    }

    // Create a pending ticket
    const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const ticket = await Ticket.create({
      attendeeId: attendee._id,
      eventId: event._id,
      orderId,
      tier: ticketTier,
      status: 'pending'
    });

    // Initialize Paystack transaction
    const host = req.headers.get("origin") || "http://localhost:3000";
    // Using `amount * 100` if the frontend sends standard currency units
    const koboAmount = Math.round(amount * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: attendee.email,
        amount: koboAmount,
        callback_url: `${host}/payment/verify`,
        metadata: {
          custom_fields: [
            { display_name: "Event ID", variable_name: "event_id", value: event._id.toString() },
            { display_name: "Attendee ID", variable_name: "attendee_id", value: attendee._id.toString() },
            { display_name: "Ticket ID", variable_name: "ticket_id", value: ticket._id.toString() }
          ],
        },
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Paystack JSON:", text);
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Payment initialization failed", details: data }, { status: response.status });
    }

    if (data.status && data.data?.authorization_url) {
      return NextResponse.json({ authorization_url: data.data.authorization_url });
    } else {
      return NextResponse.json({ error: "Invalid payment response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
