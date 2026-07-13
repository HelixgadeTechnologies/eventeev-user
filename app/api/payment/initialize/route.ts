import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
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
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    const attendee = await Attendee.findById(decoded.id);

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!attendee) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    if (!event.isPaid || !event.price) {
      return NextResponse.json({ error: "Event is free, payment not required" }, { status: 400 });
    }

    // Initialize Paystack transaction
    const host = req.headers.get("origin") || "http://localhost:3000";
    const amount = event.price * 100; // Assuming price is in NGN, converting to Kobo

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: attendee.email,
        amount,
        callback_url: `${host}/dashboard`,
        metadata: {
          custom_fields: [
            { display_name: "Event ID", variable_name: "event_id", value: event._id.toString() },
            { display_name: "Attendee ID", variable_name: "attendee_id", value: attendee._id.toString() }
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
