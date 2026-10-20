import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import crypto from "crypto";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, name, email, ticketId, ticketTier, amount } = body;

    if (!eventId || !name || !email || !ticketTier || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanEventId = typeof eventId === "string" ? eventId.trim() : String(eventId);

    // 1. Try local MongoDB and direct Paystack if configured locally
    if (process.env.MONGODB_URI && process.env.PAYSTACK_SECRET_KEY) {
      try {
        await dbConnect();

        try {
          if (mongoose.connection.db) {
            await mongoose.connection.db.collection("attendees").dropIndex("orderId_1");
          }
        } catch (e: any) {}

        const event = await Event.findOne({
          $or: [
            { slug: new RegExp(`^${cleanEventId}$`, "i") },
            { connectCode: new RegExp(`^${cleanEventId}$`, "i") },
            { title: new RegExp(`^${cleanEventId}$`, "i") },
            ...(mongoose.isValidObjectId(cleanEventId) ? [{ _id: cleanEventId }] : [])
          ]
        });

        if (event) {
          let attendee = await Attendee.findOne({ email });
          if (!attendee) {
            attendee = await Attendee.create({ name, email });
          }

          const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
          const ticket = await Ticket.create({
            attendeeId: attendee._id,
            eventId: event._id,
            orderId,
            tier: ticketTier,
            status: "pending"
          });

          const host = req.headers.get("origin") || "http://localhost:3000";
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

          const data = await response.json().catch(() => ({}));

          if (response.ok && data.status && data.data?.authorization_url) {
            return NextResponse.json({ authorization_url: data.data.authorization_url });
          }
        }
      } catch (dbErr) {
        console.warn("Local payment init failed, falling back to upstream API:", dbErr);
      }
    }

    // 2. Upstream live backend API fallback
    try {
      let resolvedEventId = cleanEventId;

      if (!mongoose.isValidObjectId(resolvedEventId)) {
        const evRes = await fetch(`${API_BASE_URL}/api/event/public/${encodeURIComponent(cleanEventId)}`, {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });
        if (evRes.ok) {
          const evData = await evRes.json();
          const ev = evData.event || evData;
          if (ev && ev._id) {
            resolvedEventId = ev._id;
          }
        }
      }

      const upstreamRes = await fetch(`${API_BASE_URL}/api/payment/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          eventId: resolvedEventId,
          name,
          email,
          ticketId,
          ticketTier,
          amount
        })
      });

      const upstreamData = await upstreamRes.json().catch(() => ({}));

      if (upstreamRes.ok && upstreamData.authorization_url) {
        return NextResponse.json({
          authorization_url: upstreamData.authorization_url,
          access_code: upstreamData.access_code,
          reference: upstreamData.reference
        });
      }

      return NextResponse.json({
        error: upstreamData.message || upstreamData.error || "Payment initialization failed",
        details: upstreamData
      }, { status: upstreamRes.status || 400 });
    } catch (upstreamErr) {
      console.error("Upstream payment initialize error:", upstreamErr);
      return NextResponse.json({ error: "Failed to connect to payment service" }, { status: 502 });
    }
  } catch (error: any) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
