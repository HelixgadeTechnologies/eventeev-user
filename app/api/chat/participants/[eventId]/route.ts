import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "@/lib/models/Event";
import Ticket from "@/lib/models/Ticket";
import Attendee from "@/lib/models/Attendee";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const xAuthToken = req.headers.get("x-auth-token");
    let token = xAuthToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader);

    let requesterId: string | null = null;
    if (token) {
      const decoded: any = verifyToken(token);
      requesterId = decoded?.attendee?.id || decoded?.id || decoded?.user?.id || null;
    }

    // 1. Try upstream backend chat participants endpoint first
    if (token) {
      try {
        let upstreamRes = await fetch(`${API_BASE_URL}/api/chat/participants/${eventId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-auth-token": token,
          },
          cache: "no-store",
        });

        // If rejected due to check-in restriction, automatically trigger self check-in and retry
        if (upstreamRes.status === 403) {
          try {
            await fetch(`${API_BASE_URL}/api/attendee/check-in-self`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "x-auth-token": token,
                "Content-Type": "application/json",
              },
            });
            upstreamRes = await fetch(`${API_BASE_URL}/api/chat/participants/${eventId}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "x-auth-token": token,
              },
              cache: "no-store",
            });
          } catch (_) {}
        }

        if (upstreamRes.ok) {
          const upstreamData = await upstreamRes.json();
          if (upstreamData && (upstreamData.organizer || Array.isArray(upstreamData.attendees))) {
            return NextResponse.json(upstreamData);
          }
        }
      } catch (upstreamErr) {
        console.warn("Upstream /api/chat/participants fetch failed, attempting fallbacks:", upstreamErr);
      }
    }

    // 2. Fallback: Query MongoDB directly if connected
    let organizer: any = null;
    const attendeesMap = new Map<string, any>();

    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        // Find Event for organizer info
        if (mongoose.isValidObjectId(eventId)) {
          const eventDoc: any = await Event.findById(eventId).populate({
            path: "owner",
            model: User,
            select: "firstName lastName name orgName avatar email",
            strictPopulate: false,
          });

          if (eventDoc?.owner) {
            const ownerObj = eventDoc.owner;
            organizer = {
              id: String(ownerObj._id),
              name:
                ownerObj.name ||
                `${ownerObj.firstName || ""} ${ownerObj.lastName || ""}`.trim() ||
                ownerObj.orgName ||
                "Event Organizer",
              avatar: ownerObj.avatar || null,
              role: "organizer",
              modelType: "User",
              isCurrentUser: requesterId ? String(ownerObj._id) === String(requesterId) : false,
            };
          }
        }

        // Query attendees via Tickets
        const tickets = await Ticket.find({
          eventId,
          status: { $in: ["valid", "used", "pending"] },
        }).populate({
          path: "attendeeId",
          model: Attendee,
          select: "name email avatarUrl",
        });

        for (const t of tickets) {
          const att: any = t.attendeeId;
          if (att && att._id) {
            const attId = String(att._id);
            attendeesMap.set(attId, {
              id: attId,
              name: att.name || "Attendee",
              avatar: att.avatarUrl || null,
              role: "attendee",
              modelType: "Attendee",
              status: t.status,
              isCheckedIn: Boolean(t.isCheckedIn || t.status === "used" || att.isCheckedIn || att.checkInTime),
              checkInTime: t.checkInTime || att.checkInTime || null,
              isCurrentUser: requesterId ? attId === String(requesterId) : false,
            });
          }
        }

        // Also query Attendee directly if eventId exists on Attendee documents
        try {
          const rawAttendees = await Attendee.find({
            eventId,
            status: { $ne: "cancelled" },
          }).select("name email avatarUrl status isCheckedIn checkInTime");

          for (const att of rawAttendees) {
            const attId = String(att._id);
            if (!attendeesMap.has(attId)) {
              attendeesMap.set(attId, {
                id: attId,
                name: att.name || "Attendee",
                avatar: (att as any).avatarUrl || null,
                role: "attendee",
                modelType: "Attendee",
                status: (att as any).status || "verified",
                isCheckedIn: Boolean((att as any).isCheckedIn || (att as any).checkInTime || (att as any).status === "verified"),
                checkInTime: (att as any).checkInTime || null,
                isCurrentUser: requesterId ? attId === String(requesterId) : false,
              });
            }
          }
        } catch (e) {}
      } catch (dbErr) {
        console.warn("Direct DB participant lookup failed:", dbErr);
      }
    }

    // 3. Fallback: Query upstream networking attendees and public event endpoints
    if (attendeesMap.size === 0 || !organizer) {
      try {
        // Fetch event details for organizer
        if (!organizer) {
          const evRes = await fetch(`${API_BASE_URL}/api/event/public/${eventId}`, { cache: "no-store" });
          if (evRes.ok) {
            const evData = await evRes.json();
            const ev = evData?.event || evData?.data || evData;
            if (ev?.owner) {
              const o = ev.owner;
              organizer = {
                id: String(o._id || o.id || "organizer"),
                name: o.name || `${o.firstName || ""} ${o.lastName || ""}`.trim() || o.orgName || "Organizer",
                avatar: o.avatar || null,
                role: "organizer",
                modelType: "User",
                isCurrentUser: requesterId ? String(o._id || o.id) === String(requesterId) : false,
              };
            }
          }
        }

        // Fetch networking attendees if attendeesMap is empty
        if (attendeesMap.size === 0) {
          const netHeaders: Record<string, string> = {};
          if (token) {
            netHeaders["Authorization"] = `Bearer ${token}`;
            netHeaders["x-auth-token"] = token;
          }
          const netRes = await fetch(`${API_BASE_URL}/api/networking/attendees/${eventId}`, {
            headers: netHeaders,
            cache: "no-store",
          });

          if (netRes.ok) {
            const netData = await netRes.json();
            const list = Array.isArray(netData) ? netData : (netData.attendees || []);
            for (const item of list) {
              const aId = String(item._id || item.id);
              if (aId && !attendeesMap.has(aId)) {
                attendeesMap.set(aId, {
                  id: aId,
                  name: item.name || "Attendee",
                  avatar: item.avatar || item.avatarUrl || null,
                  role: "attendee",
                  modelType: "Attendee",
                  status: item.status || "verified",
                  isCheckedIn: Boolean(item.isCheckedIn || item.checkInTime || item.status === "verified"),
                  checkInTime: item.checkInTime || null,
                  isCurrentUser: requesterId ? aId === String(requesterId) : false,
                });
              }
            }
          }
        }
      } catch (extErr) {
        console.warn("External fallback lookup failed:", extErr);
      }
    }

    const attendees = Array.from(attendeesMap.values());

    return NextResponse.json({
      organizer,
      attendees,
      totalCount: (organizer ? 1 : 0) + attendees.length,
    });
  } catch (error) {
    console.error("Chat Participants Fetch Error:", error);
    return NextResponse.json({
      organizer: null,
      attendees: [],
      totalCount: 0,
    });
  }
}
