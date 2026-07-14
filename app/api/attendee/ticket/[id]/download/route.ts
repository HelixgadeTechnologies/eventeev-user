import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import Attendee from "@/lib/models/Attendee";
import { verifyToken } from "@/lib/jwt";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();
    const { id: ticketId } = await params;
    const ticket: any = await Ticket.findOne({ _id: ticketId, attendeeId: decoded.id })

      .populate('eventId')
      .populate('attendeeId');

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('EVENT TICKET', { x: 50, y: 350, size: 30, font: boldFont, color: rgb(0, 0.2, 0.5) });
    
    page.drawText(`Event: ${ticket.eventId.title}`, { x: 50, y: 300, size: 20, font });
    page.drawText(`Date: ${new Date(ticket.eventId.date).toLocaleDateString()}`, { x: 50, y: 270, size: 16, font });
    page.drawText(`Location: ${ticket.eventId.location}`, { x: 50, y: 240, size: 16, font });
    
    page.drawText(`Attendee: ${ticket.attendeeId.name}`, { x: 50, y: 190, size: 18, font });
    page.drawText(`Tier: ${ticket.tier}`, { x: 50, y: 160, size: 16, font });
    page.drawText(`Order ID: ${ticket.orderId}`, { x: 50, y: 130, size: 14, font: boldFont });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${ticket.orderId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Ticket Download Error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
