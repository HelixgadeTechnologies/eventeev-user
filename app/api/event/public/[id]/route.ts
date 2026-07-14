import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const cleanId = id.trim();
    
    const event = await Event.findOne({ 
      $or: [
        { slug: new RegExp(`^${cleanId}$`, 'i') },
        { title: new RegExp(`^${cleanId}$`, 'i') },
        ...(mongoose.isValidObjectId(cleanId) ? [{ _id: cleanId }] : [])
      ],
      published: true 
    });
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event Public Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
