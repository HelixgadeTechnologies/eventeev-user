import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // Support both token shapes: { id, email } (payment flow) and { attendee: { id, email } } (login flow)
    const decoded = verifyToken(token) as { id?: string; email?: string; name?: string; attendee?: { id: string; email: string; name?: string } } | null;

    const attendeeId = decoded?.attendee?.id ?? decoded?.id;

    if (!decoded || !attendeeId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();
        const attendee = await Attendee.findById(attendeeId).select("-__v").lean();
        if (attendee) {
          const ticket = await Ticket.findOne({ attendeeId: attendee._id })
            .sort({ createdAt: -1 })
            .lean();
          return NextResponse.json({ user: attendee, ticket: ticket || null });
        }
      } catch (dbErr) {
        console.warn("Local DB lookup failed for /api/attendee/me:", dbErr);
      }
    }

    // Try upstream backend API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
    try {
      const upstreamRes = await fetch(`${API_BASE_URL}/api/attendee/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {}

    // Fallback using decoded token info
    return NextResponse.json({
      user: {
        _id: attendeeId,
        email: decoded.email || decoded.attendee?.email || "",
        name: decoded.name || decoded.attendee?.name || "Attendee"
      }
    });
  } catch (error) {
    console.error("Fetch Me Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
