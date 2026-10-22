import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import { signToken } from "@/lib/jwt";
import mongoose from "mongoose";
import crypto from "crypto";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

/**
 * GET /api/attendee/check-event?email=...&eventId=...&name=...
 *
 * Checks whether an attendee's info is already in the database for the event.
 * If found (in Ticket, Attendee, or upstream backend):
 * Issues a fresh JWT token and returns isAttendee: true so the user is taken
 * straight into the dashboard without being asked to select a ticket again.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email");
    const eventIdParam = searchParams.get("eventId");
    const nameParam = searchParams.get("name");

    if (!emailParam || !eventIdParam) {
      return NextResponse.json({ error: "email and eventId are required" }, { status: 400 });
    }

    const email = emailParam.toLowerCase().trim();
    const cleanEventId = eventIdParam.trim();

    // 1. Resolve event from local database or upstream API
    let resolvedEventId = cleanEventId;
    let eventConnectCode = cleanEventId;

    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        let eventDoc: any = null;
        if (mongoose.isValidObjectId(cleanEventId)) {
          eventDoc = await Event.findById(cleanEventId);
        }
        if (!eventDoc) {
          eventDoc = await Event.findOne({
            $or: [
              { slug: new RegExp(`^${cleanEventId}$`, "i") },
              { connectCode: new RegExp(`^${cleanEventId}$`, "i") },
              { title: new RegExp(`^${cleanEventId}$`, "i") },
            ],
          });
        }

        if (eventDoc) {
          resolvedEventId = String(eventDoc._id);
          eventConnectCode = eventDoc.connectCode || eventDoc.slug || cleanEventId;
        }

        // --- CHECK LOCAL DATABASE ---
        const attendee = await Attendee.findOne({ email });

        if (attendee) {
          const attendeeId = attendee._id;

          // Check A: Ticket exists for this event
          const eventObjectId = mongoose.isValidObjectId(resolvedEventId)
            ? new mongoose.Types.ObjectId(resolvedEventId)
            : null;

          const ticketQuery: any = {
            attendeeId,
            status: { $in: ["valid", "used", "pending"] },
            $or: [
              { eventId: resolvedEventId },
              ...(eventObjectId ? [{ eventId: eventObjectId }] : []),
            ],
          };

          const ticket = await Ticket.findOne(ticketQuery);

          if (ticket) {
            try {
              await Attendee.findByIdAndUpdate(attendee._id, {
                isCheckedIn: true,
                checkInTime: (attendee as any).checkInTime || new Date(),
                status: "verified",
              });
              if (!(ticket as any).isCheckedIn) {
                (ticket as any).isCheckedIn = true;
                (ticket as any).checkInTime = (ticket as any).checkInTime || new Date();
                await ticket.save();
              }
            } catch (_) {}

            const token = signToken({
              id: attendee._id.toString(),
              email: attendee.email,
              name: attendee.name,
              attendee: { id: attendee._id.toString(), email: attendee.email, name: attendee.name },
            });

            // Asynchronously sync check-in with upstream Render backend
            fetch(`${API_BASE_URL}/api/attendee/check-in-self`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "x-auth-token": token, "Content-Type": "application/json" },
            }).catch(() => {});

            return NextResponse.json({
              isAttendee: true,
              token,
              eventId: resolvedEventId,
              message: "Existing ticket found. Entering dashboard...",
            });
          }

          // Check B: Attendee record already has eventId associated (backend schema)
          try {
            const attendeeWithEvent = await Attendee.findOne({
              email,
              status: { $ne: "cancelled" },
              $or: [
                { eventId: resolvedEventId },
                ...(eventObjectId ? [{ eventId: eventObjectId }] : []),
              ],
            });

            if (attendeeWithEvent) {
              try {
                await Attendee.findByIdAndUpdate(attendeeWithEvent._id, {
                  isCheckedIn: true,
                  checkInTime: (attendeeWithEvent as any).checkInTime || new Date(),
                  status: "verified",
                });
              } catch (_) {}

              const token = signToken({
                id: attendeeWithEvent._id.toString(),
                email: attendeeWithEvent.email,
                name: attendeeWithEvent.name,
                attendee: {
                  id: attendeeWithEvent._id.toString(),
                  email: attendeeWithEvent.email,
                  name: attendeeWithEvent.name,
                },
              });

              fetch(`${API_BASE_URL}/api/attendee/check-in-self`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "x-auth-token": token, "Content-Type": "application/json" },
              }).catch(() => {});

              return NextResponse.json({
                isAttendee: true,
                token,
                eventId: resolvedEventId,
                message: "Event registration verified. Entering dashboard...",
              });
            }
          } catch (e) {}

          // Check C: User info exists in database — auto-create a ticket so they never select again
          const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
          const newTicket = await Ticket.create({
            attendeeId: attendee._id,
            eventId: eventObjectId || resolvedEventId,
            orderId,
            tier: "General Admission",
            status: "valid",
            isCheckedIn: true,
            checkInTime: new Date(),
          });

          try {
            await Attendee.findByIdAndUpdate(attendee._id, {
              isCheckedIn: true,
              checkInTime: new Date(),
              status: "verified",
            });
          } catch (_) {}

          const token = signToken({
            id: attendee._id.toString(),
            email: attendee.email,
            name: attendee.name,
            attendee: { id: attendee._id.toString(), email: attendee.email, name: attendee.name },
          });

          fetch(`${API_BASE_URL}/api/attendee/check-in-self`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "x-auth-token": token, "Content-Type": "application/json" },
          }).catch(() => {});

          return NextResponse.json({
            isAttendee: true,
            token,
            eventId: resolvedEventId,
            message: "User verified on database. Entering dashboard...",
          });
        }
      } catch (dbErr) {
        console.warn("Local DB check-event lookup failed, trying upstream API:", dbErr);
      }
    }

    // 2. Upstream Live Backend Check (Render API)
    try {
      // If eventConnectCode looks like an ObjectId or matches cleanEventId, resolve actual connectCode
      if (cleanEventId) {
        try {
          const evPubRes = await fetch(`${API_BASE_URL}/api/event/public/${encodeURIComponent(cleanEventId)}`, {
            cache: "no-store",
          });
          if (evPubRes.ok) {
            const evPubData = await evPubRes.json();
            const evObj = evPubData.event || evPubData;
            if (evObj?.connectCode) {
              eventConnectCode = evObj.connectCode;
              resolvedEventId = String(evObj._id || resolvedEventId);
            }
          }
        } catch (_) {}
      }

      // Upstream Check A: /api/event/connect
      const connectRes = await fetch(`${API_BASE_URL}/api/event/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectCode: eventConnectCode,
          email,
        }),
        cache: "no-store",
      });

      if (connectRes.ok) {
        const connectData = await connectRes.json();
        if (connectData.isRegistered) {
          const attendeeId = String(connectData.attendeeId || new mongoose.Types.ObjectId().toString());
          const token = signToken({
            id: attendeeId,
            email,
            name: nameParam || "Attendee",
            attendee: { id: attendeeId, email, name: nameParam || "Attendee" },
          });

          return NextResponse.json({
            isAttendee: true,
            token,
            eventId: String(connectData.eventId || resolvedEventId),
            message: "Upstream registration verified. Entering dashboard...",
          });
        }
      }
    } catch (e) {
      console.warn("Upstream /api/event/connect check failed:", e);
    }

    try {
      // Upstream Check B: Check networking attendee directory
      const netRes = await fetch(`${API_BASE_URL}/api/networking/attendees/${resolvedEventId}`, {
        cache: "no-store",
      });
      if (netRes.ok) {
        const netData = await netRes.json();
        const list = Array.isArray(netData) ? netData : (netData.attendees || []);
        const found = list.find((a: any) => a.email && a.email.toLowerCase().trim() === email);
        if (found) {
          const attendeeId = String(found._id || found.id || new mongoose.Types.ObjectId().toString());
          const token = signToken({
            id: attendeeId,
            email,
            name: found.name || nameParam || "Attendee",
            attendee: { id: attendeeId, email, name: found.name || nameParam || "Attendee" },
          });

          return NextResponse.json({
            isAttendee: true,
            token,
            eventId: resolvedEventId,
            message: "User found in attendee directory. Entering dashboard...",
          });
        }
      }
    } catch (e) {
      console.warn("Upstream networking attendees check failed:", e);
    }

    // If not found in any database record
    return NextResponse.json({ isAttendee: false });
  } catch (error) {
    console.error("Check-event Error:", error);
    return NextResponse.json({ isAttendee: false });
  }
}
