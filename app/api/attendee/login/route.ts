import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import { signToken } from "@/lib/jwt";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, orderId, ticketRef, eventId } = body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanRef = (orderId || ticketRef) ? String(orderId || ticketRef).trim() : null;
    const cleanEventId = eventId ? String(eventId).trim() : null;

    if (!cleanEmail && !cleanRef) {
      return NextResponse.json(
        { error: "Please provide your email address or ticket reference to sign in." },
        { status: 400 }
      );
    }

    let attendeeObj: any = null;
    let ticketObj: any = null;
    let eventObj: any = null;

    // 1. Check Local MongoDB if available
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        // Path A: Look up by Ticket Reference / Order ID
        if (cleanRef) {
          ticketObj = await Ticket.findOne({
            orderId: new RegExp(`^${cleanRef}$`, "i"),
          }).lean();

          if (ticketObj) {
            attendeeObj = await Attendee.findById(ticketObj.attendeeId).lean();
            if (ticketObj.eventId) {
              eventObj = await Event.findById(ticketObj.eventId).lean();
            }
          }
        }

        // Path B: Look up by Email
        if (cleanEmail && !attendeeObj) {
          attendeeObj = await Attendee.findOne({ email: cleanEmail }).lean();

          if (attendeeObj) {
            // Find ticket for cleanEventId or most recent ticket
            if (cleanEventId) {
              // Resolve event
              eventObj = await Event.findOne({
                $or: [
                  { slug: new RegExp(`^${cleanEventId}$`, "i") },
                  { connectCode: new RegExp(`^${cleanEventId}$`, "i") },
                  { title: new RegExp(`^${cleanEventId}$`, "i") },
                  ...(mongoose.isValidObjectId(cleanEventId) ? [{ _id: cleanEventId }] : []),
                ],
              }).lean();

              if (eventObj) {
                ticketObj = await Ticket.findOne({
                  attendeeId: attendeeObj._id,
                  eventId: eventObj._id,
                }).lean();
              }
            }

            if (!ticketObj) {
              // Get most recent ticket
              ticketObj = await Ticket.findOne({ attendeeId: attendeeObj._id })
                .sort({ createdAt: -1 })
                .lean();

              if (ticketObj && !eventObj && ticketObj.eventId) {
                eventObj = await Event.findById(ticketObj.eventId).lean();
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("Local DB login query error:", dbErr);
      }
    }

    // 2. Upstream Backend API Fallback
    if (!attendeeObj && cleanEmail && cleanEventId) {
      try {
        const checkRes = await fetch(
          `${API_BASE_URL}/api/attendee/check-event?email=${encodeURIComponent(cleanEmail)}&eventId=${encodeURIComponent(cleanEventId)}`,
          { cache: "no-store" }
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.isAttendee) {
            const token = checkData.token || signToken({
              id: checkData.attendee?._id || checkData.attendee?.id,
              email: cleanEmail,
              name: checkData.attendee?.name || "Attendee",
              eventId: checkData.eventId || cleanEventId,
            });

            const response = NextResponse.json({
              success: true,
              message: "Login successful",
              token,
              eventId: checkData.eventId || cleanEventId,
              attendee: checkData.attendee || { email: cleanEmail },
              event: checkData.event || null,
            });

            response.cookies.set("token", token, {
              path: "/",
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              maxAge: 30 * 24 * 60 * 60,
            });

            return response;
          }
        }
      } catch (e) {}
    }

    if (!attendeeObj && !ticketObj) {
      return NextResponse.json(
        { error: "No registered ticket found matching your details. Please check your credentials or register for the event." },
        { status: 404 }
      );
    }

    const finalAttendeeId = String(attendeeObj?._id || attendeeObj?.id || ticketObj?.attendeeId || "");
    const finalEmail = attendeeObj?.email || cleanEmail || "";
    const finalName = attendeeObj?.name || "Attendee";
    const finalEventId = String(eventObj?._id || eventObj?.id || ticketObj?.eventId || cleanEventId || "");

    const token = signToken(
      {
        id: finalAttendeeId,
        email: finalEmail,
        name: finalName,
        eventId: finalEventId,
      },
      "30d"
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      eventId: finalEventId,
      attendee: {
        id: finalAttendeeId,
        name: finalName,
        email: finalEmail,
        isCheckedIn: Boolean(attendeeObj?.isCheckedIn || ticketObj?.isCheckedIn),
      },
      ticket: ticketObj
        ? {
            id: String(ticketObj._id || ticketObj.id),
            orderId: ticketObj.orderId,
            tier: ticketObj.tier || "General Admission",
            status: ticketObj.status || "valid",
            isCheckedIn: Boolean(ticketObj.isCheckedIn),
          }
        : null,
      event: eventObj
        ? {
            id: finalEventId,
            title: eventObj.title,
            location: eventObj.location,
            startDate: eventObj.startDate || eventObj.date || null,
          }
        : null,
    });

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
    });
    if (finalEventId) {
      response.cookies.set("eventId", finalEventId, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 });
  }
}
