import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Schedule from "@/lib/models/Schedule";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await req.json();

    // Prevent _id or id from being overwritten during update
    delete data._id;
    delete data.id;

    const updatedSchedule = await Schedule.findByIdAndUpdate(id, data, { new: true });
    
    if (!updatedSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Schedule Update Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    
    if (!deletedSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Schedule item deleted successfully" });
  } catch (error) {
    console.error("Schedule Delete Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
