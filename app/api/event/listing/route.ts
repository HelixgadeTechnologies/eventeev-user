import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function GET() {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();
        const events = await Event.find({ status: "Published" }).sort({ date: 1 });
        if (events && events.length > 0) {
          return NextResponse.json({ events });
        }
      } catch (dbErr) {
        console.warn("Local DB query failed, falling back to upstream API:", dbErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/event/listing`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (remoteErr) {
      console.error("Upstream API fetch failed for event listing:", remoteErr);
    }

    return NextResponse.json({ events: [] });
  } catch (error) {
    console.error("Event Listing Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
