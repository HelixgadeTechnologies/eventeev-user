import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Connection from "@/lib/models/Connection";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { eventId } = await params;

    const connections = await Connection.find({
      eventId,
      $or: [{ requesterId: decoded.id }, { recipientId: decoded.id }]
    }).populate({ path: 'requesterId recipientId', model: Attendee, select: 'name email avatarUrl' });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Networking Connections Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
