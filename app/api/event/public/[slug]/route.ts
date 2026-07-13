import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await dbConnect();
    const event = await Event.findOne({ slug: params.slug, published: true });
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event Public Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
