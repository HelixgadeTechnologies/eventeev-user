import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat/upload
 * Accepts multipart/form-data with a "file" field.
 * Stores the media in MongoDB chat_uploads collection and returns its persistent URL.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit to 10MB to fit within MongoDB 16MB document limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not ready");
    }

    const uploadsCollection = db.collection("chat_uploads");

    const result = await uploadsCollection.insertOne({
      filename: file.name || "attachment",
      contentType: file.type || "application/octet-stream",
      size: file.size,
      data: buffer,
      createdAt: new Date(),
    });

    const fileId = String(result.insertedId);
    const fileUrl = `/api/chat/upload/${fileId}`;

    return NextResponse.json(
      {
        success: true,
        id: fileId,
        url: fileUrl,
        filename: file.name,
        size: file.size,
        contentType: file.type,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Chat Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
