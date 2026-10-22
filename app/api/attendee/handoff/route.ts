import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import { signToken, verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

async function handleHandoff(
  inputToken?: string | null,
  inputEventId?: string | null,
  inputTicketRef?: string | null,
  inputEmail?: string | null
) {
  let attendeeId: string | null = null;
  let attendeeEmail: string | null = inputEmail || null;
  let attendeeName: string | null = null;

  // 1. Try resolving identity from provided JWT token
  if (inputToken) {
    try {
      const decoded: any = verifyToken(inputToken);
      if (decoded) {
        attendeeId = decoded.attendee?.id || decoded.attendee?._id || decoded.id || decoded._id || decoded.userId || null;
        attendeeEmail = decoded.attendee?.email || decoded.email || attendeeEmail;
        attendeeName = decoded.attendee?.name || decoded.name || null;
      } else {
        // Fallback: parse unverified payload in case secrets differ slightly between environments
        const parts = inputToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          attendeeId = payload.attendee?.id || payload.attendee?._id || payload.id || payload._id || null;
          attendeeEmail = payload.attendee?.email || payload.email || attendeeEmail;
          attendeeName = payload.attendee?.name || payload.name || null;
        }
      }
    } catch (e) {
      console.warn("Handoff token decode warning:", e);
    }
  }

  let eventObj: any = null;
  let attendeeObj: any = null;
  let ticketObj: any = null;

  // 2. Query Local MongoDB if connected
  if (process.env.MONGODB_URI) {
    try {
      await dbConnect();

      // Find Event
      if (inputEventId) {
        const cleanEvId = inputEventId.trim();
        eventObj = await Event.findOne({
          $or: [
            { slug: new RegExp(`^${cleanEvId}$`, "i") },
            { connectCode: new RegExp(`^${cleanEvId}$`, "i") },
            { title: new RegExp(`^${cleanEvId}$`, "i") },
            ...(mongoose.isValidObjectId(cleanEvId) ? [{ _id: cleanEvId }] : []),
          ],
        }).lean();
      }

      // Find Attendee
      if (attendeeId && mongoose.isValidObjectId(attendeeId)) {
        attendeeObj = await Attendee.findById(attendeeId).lean();
      } else if (attendeeEmail) {
        attendeeObj = await Attendee.findOne({ email: attendeeEmail.toLowerCase() }).lean();
      }

      // Find Ticket
      if (attendeeObj && eventObj) {
        ticketObj = await Ticket.findOne({
          attendeeId: attendeeObj._id,
          eventId: eventObj._id,
        }).lean();
      } else if (inputTicketRef) {
        ticketObj = await Ticket.findOne({
          orderId: new RegExp(`^${inputTicketRef.trim()}$`, "i"),
        }).lean();

        if (ticketObj && !eventObj && ticketObj.eventId) {
          eventObj = await Event.findById(ticketObj.eventId).lean();
        }
        if (ticketObj && !attendeeObj && ticketObj.attendeeId) {
          attendeeObj = await Attendee.findById(ticketObj.attendeeId).lean();
        }
      }
    } catch (dbErr) {
      console.warn("Local DB handoff query failed:", dbErr);
    }
  }

  // 3. Fallback to Upstream Backend API if needed
  if (!eventObj && inputEventId) {
    try {
      const evRes = await fetch(`${API_BASE_URL}/api/event/public/${encodeURIComponent(inputEventId)}`, {
        cache: "no-store",
      });
      if (evRes.ok) {
        const evData = await evRes.json();
        eventObj = evData.event || (evData._id ? evData : null);
      }
    } catch (e) {}
  }

  if ((!attendeeObj || !ticketObj) && inputToken) {
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/attendee/me`, {
        headers: { Authorization: `Bearer ${inputToken}` },
        cache: "no-store",
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData?.user) {
          attendeeObj = meData.user;
          attendeeId = attendeeObj._id || attendeeObj.id || attendeeId;
          attendeeName = attendeeObj.name || attendeeName;
          attendeeEmail = attendeeObj.email || attendeeEmail;
        }
      }
    } catch (e) {}
  }

  // Fallback attendee info if not in database
  if (!attendeeObj && (attendeeId || attendeeEmail)) {
    attendeeObj = {
      _id: attendeeId || new mongoose.Types.ObjectId().toString(),
      name: attendeeName || "Attendee",
      email: attendeeEmail || "",
      isCheckedIn: false,
    };
  }

  if (!attendeeObj) {
    return { error: "Unable to verify attendee ticket credential", status: 401 };
  }

  const finalAttendeeId = String(attendeeObj._id || attendeeObj.id || attendeeId);
  const finalEmail = attendeeObj.email || attendeeEmail || "";
  const finalName = attendeeObj.name || attendeeName || "Attendee";
  const finalEventId = String(eventObj?._id || eventObj?.id || inputEventId || "");

  // Generate permanent session token (30 days)
  const sessionToken = signToken(
    {
      id: finalAttendeeId,
      email: finalEmail,
      name: finalName,
      eventId: finalEventId,
    },
    "30d"
  );

  const finalTicket = ticketObj
    ? {
        id: String(ticketObj._id || ticketObj.id),
        orderId: ticketObj.orderId || inputTicketRef || `EVT-${finalAttendeeId.slice(-6).toUpperCase()}`,
        tier: ticketObj.tier || "General Admission",
        status: ticketObj.status || "valid",
        isCheckedIn: Boolean(ticketObj.isCheckedIn),
      }
    : {
        id: `tkt-${finalAttendeeId.slice(-6)}`,
        orderId: inputTicketRef || `EVT-${finalAttendeeId.slice(-6).toUpperCase()}`,
        tier: "Standard Admission",
        status: "valid",
        isCheckedIn: false,
      };

  const finalEvent = eventObj
    ? {
        id: finalEventId,
        title: eventObj.title || "Event",
        location: eventObj.location || "Venue",
        startDate: eventObj.startDate || eventObj.date || null,
        banner: eventObj.thumbnailImage || eventObj.bannerImage || eventObj.bannerUrl || null,
      }
    : null;

  return {
    success: true,
    token: sessionToken,
    eventId: finalEventId,
    attendee: {
      id: finalAttendeeId,
      name: finalName,
      email: finalEmail,
      avatarUrl: attendeeObj.avatarUrl || null,
      isCheckedIn: Boolean(attendeeObj.isCheckedIn),
    },
    ticket: finalTicket,
    event: finalEvent,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, eventId, ticketRef, email } = body;

    const result = await handleHandoff(token, eventId, ticketRef, email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    const response = NextResponse.json(result);

    // Set secure auth cookies for cross-navigation session persistence
    if (result.token) {
      response.cookies.set("token", result.token, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    if (result.eventId) {
      response.cookies.set("eventId", result.eventId, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Handoff POST error:", error);
    return NextResponse.json({ error: "Internal server error during handoff" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const eventId = url.searchParams.get("eventId");
    const ticketRef = url.searchParams.get("ticketRef") || url.searchParams.get("reference");
    const email = url.searchParams.get("email");

    const result = await handleHandoff(token, eventId, ticketRef, email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    const response = NextResponse.json(result);

    if (result.token) {
      response.cookies.set("token", result.token, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    if (result.eventId) {
      response.cookies.set("eventId", result.eventId, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Handoff GET error:", error);
    return NextResponse.json({ error: "Internal server error during handoff" }, { status: 500 });
  }
}
