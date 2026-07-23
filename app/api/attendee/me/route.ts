import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // Support both token shapes: { id, email } (payment flow) and { attendee: { id, email } } (login flow)
    const decoded = verifyToken(token) as { id?: string; email?: string; attendee?: { id: string; email: string } } | null;

    const attendeeId = decoded?.attendee?.id ?? decoded?.id;

    if (!decoded || !attendeeId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const attendee = await Attendee.findById(attendeeId).select("-__v");
    if (!attendee) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: attendee });
  } catch (error) {
    console.error("Fetch Me Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
