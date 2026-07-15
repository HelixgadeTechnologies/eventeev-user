import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

export async function GET() {
  try {
    await dbConnect();
    const events = await Event.find({ status: "Published" }).sort({ date: 1 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Event Listing Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
