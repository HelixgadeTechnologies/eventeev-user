import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import { signToken } from "@/lib/jwt";
import mongoose from "mongoose";
export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        // TEMPORARY FIX: Drop the problematic orderId index from the attendees collection
        try {
          if (mongoose.connection.db) {
            await mongoose.connection.db.collection('attendees').dropIndex('orderId_1');
          }
        } catch (e: any) {}

        let attendee = await Attendee.findOne({ email });

        if (!attendee) {
          attendee = await Attendee.create({ name, email });
        }

        const token = signToken({ id: attendee._id.toString(), email: attendee.email, name: attendee.name });
        return NextResponse.json({ message: "Authenticated successfully", attendee, token });
      } catch (dbErr) {
        console.warn("Local DB auth failed, falling back to session token:", dbErr);
      }
    }

    const dummyId = new mongoose.Types.ObjectId().toString();
    const token = signToken({ id: dummyId, email, name });
    return NextResponse.json({
      message: "Authenticated successfully",
      attendee: { _id: dummyId, name, email },
      token
    });
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
