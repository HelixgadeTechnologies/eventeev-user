import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ticket from "@/lib/models/Ticket";
import Attendee from "@/lib/models/Attendee";
import { signToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json({ error: "Failed to verify transaction", details: data }, { status: 400 });
    }

    if (data.data.status !== "success") {
      return NextResponse.json({ error: "Transaction was not successful", status: data.data.status }, { status: 400 });
    }

    await dbConnect();

    // The custom fields contain our metadata
    const customFields = data.data.metadata?.custom_fields || [];
    const ticketField = customFields.find((f: any) => f.variable_name === "ticket_id");
    const attendeeField = customFields.find((f: any) => f.variable_name === "attendee_id");

    if (!ticketField || !attendeeField) {
      return NextResponse.json({ error: "Missing metadata in transaction" }, { status: 400 });
    }

    const ticketId = ticketField.value;
    const attendeeId = attendeeField.value;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update ticket status to valid
    ticket.status = 'valid';
    await ticket.save();

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    }

    // Generate JWT token
    const token = signToken({ id: attendee._id, email: attendee.email });

    return NextResponse.json({ message: "Payment verified successfully", token, eventId: ticket.eventId });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
