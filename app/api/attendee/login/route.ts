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
    const { email, orderId, ticketRef, eventId, code } = body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanRef = (orderId || ticketRef) ? String(orderId || ticketRef).trim() : null;
    const cleanEventId = (eventId || code) ? String(eventId || code).trim() : null;

    if (!cleanEmail && !cleanRef) {
      return NextResponse.json(
        { error: "Please provide your email address or ticket reference to sign in." },
        { status: 400 }
      );
    }

    let attendeeObj: any = null;
    let ticketObj: any = null;
    let eventObj: any = null;
    let resolvedEventId = cleanEventId;
    let resolvedConnectCode = cleanEventId;

    // 1. Resolve event details from upstream API if cleanEventId provided
    if (cleanEventId) {
      try {
        const evRes = await fetch(`${API_BASE_URL}/api/event/public/${encodeURIComponent(cleanEventId)}`, {
          cache: "no-store",
        });
        if (evRes.ok) {
          const evData = await evRes.json();
          const foundEv = evData.event || evData;
          if (foundEv) {
            eventObj = foundEv;
            resolvedEventId = String(foundEv._id || cleanEventId);
            resolvedConnectCode = foundEv.connectCode || foundEv.slug || cleanEventId;
          }
        }
      } catch (e) {
        console.warn("Could not resolve event details from upstream:", e);
      }
    }

    // 2. Check Local MongoDB if available
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
            if (ticketObj.eventId && !eventObj) {
              eventObj = await Event.findById(ticketObj.eventId).lean();
              if (eventObj) {
                resolvedEventId = String(eventObj._id);
                resolvedConnectCode = eventObj.connectCode || eventObj.slug;
              }
            }
          }
        }

        // Path B: Look up by Email
        if (cleanEmail && !attendeeObj) {
          attendeeObj = await Attendee.findOne({ email: cleanEmail }).lean();

          if (attendeeObj) {
            if (resolvedEventId) {
              const eventObjectId = mongoose.isValidObjectId(resolvedEventId)
                ? new mongoose.Types.ObjectId(resolvedEventId)
                : null;

              ticketObj = await Ticket.findOne({
                attendeeId: attendeeObj._id,
                $or: [
                  { eventId: resolvedEventId },
                  ...(eventObjectId ? [{ eventId: eventObjectId }] : []),
                ],
              }).lean();
            }

            if (!ticketObj) {
              ticketObj = await Ticket.findOne({ attendeeId: attendeeObj._id })
                .sort({ createdAt: -1 })
                .lean();

              if (ticketObj && !eventObj && ticketObj.eventId) {
                eventObj = await Event.findById(ticketObj.eventId).lean();
                if (eventObj) {
                  resolvedEventId = String(eventObj._id);
                  resolvedConnectCode = eventObj.connectCode || eventObj.slug;
                }
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("Local DB login query error:", dbErr);
      }
    }

    // 3. Upstream Strategy A: Backend /api/attendee/login (Email + OrderId)
    if (!attendeeObj && cleanEmail && cleanRef) {
      try {
        const backendLoginRes = await fetch(`${API_BASE_URL}/api/attendee/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            orderId: cleanRef,
            paymentReference: cleanRef,
          }),
          cache: "no-store",
        });

        if (backendLoginRes.ok) {
          const bData = await backendLoginRes.json();
          if (bData.attendee || bData.token) {
            attendeeObj = bData.attendee || { email: cleanEmail };
            if (bData.attendee?.eventId) {
              resolvedEventId = String(bData.attendee.eventId._id || bData.attendee.eventId);
              eventObj = typeof bData.attendee.eventId === "object" ? bData.attendee.eventId : eventObj;
            }
          }
        }
      } catch (e) {
        console.warn("Backend /api/attendee/login attempt failed:", e);
      }
    }

    // 4. Upstream Strategy B: Backend /api/event/connect (Email + ConnectCode)
    if (!attendeeObj && cleanEmail) {
      // Try with resolvedConnectCode if we have one
      const connectCodesToTry: string[] = [];
      if (resolvedConnectCode) connectCodesToTry.push(resolvedConnectCode);
      if (cleanEventId && !connectCodesToTry.includes(cleanEventId)) connectCodesToTry.push(cleanEventId);

      // If no event specified, fetch active events from listing
      if (connectCodesToTry.length === 0) {
        try {
          const listRes = await fetch(`${API_BASE_URL}/api/event/listing?limit=10`, { cache: "no-store" });
          if (listRes.ok) {
            const listData = await listRes.json();
            const events = Array.isArray(listData) ? listData : (listData.data || []);
            for (const ev of events) {
              if (ev.connectCode && !connectCodesToTry.includes(ev.connectCode)) {
                connectCodesToTry.push(ev.connectCode);
              }
            }
          }
        } catch (e) {}
      }

      for (const codeToTest of connectCodesToTry) {
        try {
          const connectRes = await fetch(`${API_BASE_URL}/api/event/connect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectCode: codeToTest,
              email: cleanEmail,
            }),
            cache: "no-store",
          });

          if (connectRes.ok) {
            const cData = await connectRes.json();
            if (cData.isRegistered) {
              resolvedEventId = String(cData.eventId || resolvedEventId || codeToTest);
              eventObj = cData.event || eventObj;
              attendeeObj = {
                _id: String(cData.attendeeId || new mongoose.Types.ObjectId().toString()),
                email: cleanEmail,
                name: cleanEmail.split("@")[0],
                isCheckedIn: true,
              };
              break;
            }
          }
        } catch (e) {}
      }
    }

    // 5. Upstream Strategy C: Backend networking attendee directory lookup
    if (!attendeeObj && cleanEmail && resolvedEventId) {
      try {
        const netRes = await fetch(`${API_BASE_URL}/api/networking/attendees/${encodeURIComponent(resolvedEventId)}`, {
          cache: "no-store",
        });
        if (netRes.ok) {
          const netData = await netRes.json();
          const list = Array.isArray(netData) ? netData : (netData.attendees || []);
          const found = list.find((a: any) => a.email && a.email.toLowerCase().trim() === cleanEmail);
          if (found) {
            attendeeObj = found;
          }
        }
      } catch (e) {}
    }

    // 6. If no attendee record found across all sources, return 401 Unauthorized (NOT 404)
    if (!attendeeObj && !ticketObj) {
      return NextResponse.json(
        {
          success: false,
          error: "No active ticket or attendee registration found matching your details. Please check your credentials or register for the event."
        },
        { status: 401 }
      );
    }

    const finalAttendeeId = String(attendeeObj?._id || attendeeObj?.id || ticketObj?.attendeeId || new mongoose.Types.ObjectId().toString());
    const finalEmail = attendeeObj?.email || cleanEmail || "";
    const finalName = attendeeObj?.name || (finalEmail ? finalEmail.split("@")[0] : "Attendee");
    const finalEventId = String(eventObj?._id || eventObj?.id || ticketObj?.eventId || resolvedEventId || "");

    const token = signToken(
      {
        id: finalAttendeeId,
        email: finalEmail,
        name: finalName,
        eventId: finalEventId,
        attendee: {
          id: finalAttendeeId,
          email: finalEmail,
          name: finalName,
        },
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
        : {
            orderId: cleanRef || `ORD-${finalAttendeeId.slice(-6).toUpperCase()}`,
            tier: "General Admission",
            status: "valid",
            isCheckedIn: true,
          },
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
    console.error("Login Route Error:", error);
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 });
  }
}
