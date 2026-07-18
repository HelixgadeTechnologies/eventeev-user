import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Schedule from "@/lib/models/Schedule";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    
    // Map 'event' to 'eventId' if provided
    if (data.event && !data.eventId) {
      data.eventId = data.event;
    }

    const newSchedule = await Schedule.create(data);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Schedule Create Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
