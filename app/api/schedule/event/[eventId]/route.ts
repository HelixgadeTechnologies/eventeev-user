import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";

// NOTE: Since there was no explicitly requested 'Schedule' model, we are mocking this 
// response or it could be added to the Event model.
export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    await dbConnect();
    // Assuming schedule is an array we fetch. Here we just mock it for the structure.
    const schedule = [
      { id: 1, time: "09:00 AM", title: "Registration & Breakfast", speaker: "" },
      { id: 2, time: "10:00 AM", title: "Keynote Address", speaker: "John Doe" },
      { id: 3, time: "11:30 AM", title: "Networking Session", speaker: "" },
    ];
    
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Schedule Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
