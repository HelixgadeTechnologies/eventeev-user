import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Connection from "@/lib/models/Connection";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { recipientId, eventId } = await req.json();

    if (!recipientId || !eventId) {
      return NextResponse.json({ error: "recipientId and eventId are required" }, { status: 400 });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({
      eventId,
      $or: [
        { requesterId: decoded.id, recipientId },
        { requesterId: recipientId, recipientId: decoded.id }
      ]
    });

    if (existing) {
      return NextResponse.json({ error: "Connection request already exists" }, { status: 400 });
    }

    const connection = await Connection.create({
      requesterId: decoded.id,
      recipientId,
      eventId,
      status: 'pending'
    });

    return NextResponse.json({ message: "Connection request sent", connection });
  } catch (error) {
    console.error("Connect Request Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
