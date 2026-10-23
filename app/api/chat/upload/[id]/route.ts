import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/upload/[id]
 * Streams the uploaded media file directly from MongoDB with appropriate content headers.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const fileDoc = await db.collection("chat_uploads").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!fileDoc || !fileDoc.data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert BSON Binary or Buffer to Uint8Array for NextResponse
    const buffer = Buffer.isBuffer(fileDoc.data)
      ? fileDoc.data
      : (fileDoc.data.buffer || Buffer.from(fileDoc.data));

    const contentType = fileDoc.contentType || "application/octet-stream";
    const filename = encodeURIComponent(fileDoc.filename || "file");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": contentType.startsWith("image/")
          ? `inline; filename="${filename}"`
          : `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Chat Upload Retrieval Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
