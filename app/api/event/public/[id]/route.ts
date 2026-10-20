import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = id ? id.trim() : "";

    if (!cleanId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // 1. Try local MongoDB if MONGODB_URI is provided
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        const event = await Event.findOne({ 
          $or: [
            { slug: new RegExp(`^${cleanId}$`, 'i') },
            { connectCode: new RegExp(`^${cleanId}$`, 'i') },
            ...(mongoose.isValidObjectId(cleanId) ? [{ _id: cleanId }] : [])
          ],
          status: "Published" 
        });

        if (event) {
          const eventObj = event.toObject ? event.toObject() : event;
          return NextResponse.json({ event: eventObj, ...eventObj });
        }
      } catch (dbErr) {
        console.warn("Local DB lookup failed, falling back to upstream API:", dbErr);
      }
    }

    // 2. Fallback to live backend API
    try {
      const remoteRes = await fetch(`${API_BASE_URL}/api/event/public/${encodeURIComponent(cleanId)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        const eventObj = data.event || data;
        return NextResponse.json({ event: eventObj, ...eventObj });
      }

      if (remoteRes.status === 404) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    } catch (remoteErr) {
      console.error("Upstream API fetch failed:", remoteErr);
    }

    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  } catch (error) {
    console.error("Event Public Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
