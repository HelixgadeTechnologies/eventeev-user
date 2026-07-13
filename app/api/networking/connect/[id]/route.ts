import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Connection from "@/lib/models/Connection";
import { verifyToken } from "@/lib/jwt";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { status } = await req.json();

    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const connection = await Connection.findOne({ _id: params.id, recipientId: decoded.id });

    if (!connection) {
      return NextResponse.json({ error: "Connection request not found" }, { status: 404 });
    }

    connection.status = status;
    await connection.save();

    return NextResponse.json({ message: `Connection ${status}`, connection });
  } catch (error) {
    console.error("Update Connection Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
