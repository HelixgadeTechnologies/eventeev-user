import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    let attendee = await Attendee.findOne({ email });

    if (!attendee) {
      attendee = await Attendee.create({ name, email });
    }

    const token = signToken({ id: attendee._id, email: attendee.email });

    return NextResponse.json({ message: "Registered successfully", attendee, token });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
