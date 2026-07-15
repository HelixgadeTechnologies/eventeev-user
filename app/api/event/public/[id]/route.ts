import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const cleanId = id.trim();
    
    console.log("=== PUBLIC API FETCH ===");
    console.log("Searching for event code:", cleanId);
    
    const allEvents = await Event.find({}).limit(5);
    console.log("First 5 events in DB:", allEvents.map(e => ({ title: e.title, slug: e.slug, status: e.status, id: e._id })));

    // Check if it exists at all, regardless of status
    const anyEvent = await Event.findOne({
      $or: [
        { slug: new RegExp(`^${cleanId}$`, 'i') },
        ...(mongoose.isValidObjectId(cleanId) ? [{ _id: cleanId }] : [])
      ]
    });
    
    console.log("Did we find it regardless of status?", anyEvent ? `YES - Status: ${anyEvent.status}` : "NO");

    const event = await Event.findOne({ 
      $or: [
        { slug: new RegExp(`^${cleanId}$`, 'i') },
        ...(mongoose.isValidObjectId(cleanId) ? [{ _id: cleanId }] : [])
      ],
      status: "Published" 
    });
    
    if (!event) {
      console.log("Returning 404 because event not found (or not published).");
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    console.log("Returning event successfully!");

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event Public Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
