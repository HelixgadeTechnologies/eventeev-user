import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, googleId, avatarUrl } = await req.json();

    if (!email || !googleId) {
      return NextResponse.json({ error: "Email and googleId are required" }, { status: 400 });
    }

    let attendee = await Attendee.findOne({ email });

    if (!attendee) {
      attendee = await Attendee.create({ name, email, googleId, avatarUrl });
    } else if (!attendee.googleId) {
      attendee.googleId = googleId;
      attendee.avatarUrl = avatarUrl;
      await attendee.save();
    }

    const token = signToken({ id: attendee._id, email: attendee.email });

    return NextResponse.json({ message: "Google register/login successful", attendee, token });
  } catch (error) {
    console.error("Google Register Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
