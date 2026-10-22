import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendee from "@/lib/models/Attendee";
import Ticket from "@/lib/models/Ticket";
import Event from "@/lib/models/Event";
import Connection from "@/lib/models/Connection";
import Poll from "@/lib/models/Poll";
import Trivia from "@/lib/models/Trivia";
import ChatMessage from "@/lib/models/ChatMessage";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("token")?.value;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as {
      id?: string;
      email?: string;
      name?: string;
      attendee?: { id: string; email: string; name?: string };
      eventId?: string;
    } | null;

    const attendeeId = decoded?.attendee?.id ?? decoded?.id;
    if (!decoded || !attendeeId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const rawEventId = searchParams.get("eventId") || decoded.eventId || req.cookies.get("eventId")?.value;
    const cleanEventId = rawEventId ? rawEventId.trim() : null;

    let attendeeObj: any = null;
    let ticketObj: any = null;
    let eventObj: any = null;
    let connectionsCount = 0;
    let totalPolls = 0;
    let votedPolls = 0;
    let triviaScore = 0;
    let messagesCount = 0;

    // 1. Try Local MongoDB queries
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();

        // Find Attendee
        if (mongoose.isValidObjectId(attendeeId)) {
          attendeeObj = await Attendee.findById(attendeeId).lean();
        } else if (decoded.email) {
          attendeeObj = await Attendee.findOne({ email: decoded.email.toLowerCase() }).lean();
        }

        // Find Event if provided
        if (cleanEventId) {
          eventObj = await Event.findOne({
            $or: [
              { slug: new RegExp(`^${cleanEventId}$`, "i") },
              { connectCode: new RegExp(`^${cleanEventId}$`, "i") },
              ...(mongoose.isValidObjectId(cleanEventId) ? [{ _id: cleanEventId }] : []),
            ],
          }).lean();
        }

        const effectiveAttendeeId = attendeeObj?._id || (mongoose.isValidObjectId(attendeeId) ? attendeeId : null);
        const effectiveEventId = eventObj?._id;

        if (effectiveAttendeeId) {
          // Parallel aggregation queries
          const [
            ticketResult,
            connectionsResult,
            pollsTotalResult,
            pollsVotedResult,
            triviaResult,
            chatResult,
          ] = await Promise.all([
            // Ticket
            Ticket.findOne({
              attendeeId: effectiveAttendeeId,
              ...(effectiveEventId ? { eventId: effectiveEventId } : {}),
            })
              .sort({ createdAt: -1 })
              .lean(),

            // Accepted connections
            Connection.countDocuments({
              ...(effectiveEventId ? { eventId: effectiveEventId } : {}),
              status: "accepted",
              $or: [{ requesterId: effectiveAttendeeId }, { recipientId: effectiveAttendeeId }],
            }),

            // Total polls
            Poll.countDocuments({
              ...(effectiveEventId ? { eventId: effectiveEventId } : {}),
              status: "active",
            }),

            // Polls voted by attendee
            Poll.countDocuments({
              ...(effectiveEventId ? { eventId: effectiveEventId } : {}),
              "options.voters": effectiveAttendeeId,
            }),

            // Trivia participation
            Trivia.findOne({
              ...(effectiveEventId ? { eventId: effectiveEventId } : {}),
              "leaderboard.attendeeId": effectiveAttendeeId,
            }).lean(),

            // Chat messages
            ChatMessage.countDocuments({
              senderId: effectiveAttendeeId,
            }),
          ]);

          ticketObj = ticketResult;
          connectionsCount = connectionsResult;
          totalPolls = pollsTotalResult;
          votedPolls = pollsVotedResult;
          messagesCount = chatResult;

          if (triviaResult && Array.isArray((triviaResult as any).leaderboard)) {
            const entry = (triviaResult as any).leaderboard.find(
              (item: any) => String(item.attendeeId) === String(effectiveAttendeeId)
            );
            if (entry) {
              triviaScore = entry.score || 0;
            }
          }
        }
      } catch (dbErr) {
        console.warn("Local DB query in /api/attendee/progress failed:", dbErr);
      }
    }

    // 2. Upstream Backend Fallback for Attendee check if not in local DB
    if (!attendeeObj && cleanEventId && decoded.email) {
      try {
        const checkRes = await fetch(
          `${API_BASE_URL}/api/attendee/check-event?email=${encodeURIComponent(decoded.email)}&eventId=${encodeURIComponent(cleanEventId)}`,
          { cache: "no-store" }
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.attendee) {
            attendeeObj = checkData.attendee;
          }
        }
      } catch (e) {}
    }

    const isCheckedIn = Boolean(ticketObj?.isCheckedIn || attendeeObj?.isCheckedIn);
    const orderId =
      ticketObj?.orderId ||
      (attendeeObj?._id ? `ORD-${String(attendeeObj._id).slice(-6).toUpperCase()}` : "ORD-PASS");
    const ticketTier = ticketObj?.tier || "General Admission";
    const pulsePoints = attendeeObj?.points || triviaScore || 450;
    const rank = attendeeObj?.rank ? `#${attendeeObj.rank}` : "#12";

    // Weighted milestone calculation
    const milestones = [
      {
        id: "ticket",
        title: "Ticket Confirmed",
        category: "registration",
        status: "completed" as const,
        weight: 25,
        detail: `${ticketTier} (${orderId})`,
      },
      {
        id: "checkin",
        title: "Venue Check-In",
        category: "checkin",
        status: (isCheckedIn ? "completed" : "pending") as "completed" | "pending",
        weight: 25,
        detail: isCheckedIn ? "Checked in at Venue" : "Pending entry gate scan",
        timestamp: ticketObj?.checkInTime || attendeeObj?.checkInTime || null,
      },
      {
        id: "trivia",
        title: "Pulse & Trivia",
        category: "engagement",
        status: (pulsePoints > 0 || votedPolls > 0 ? "completed" : "pending") as "completed" | "pending",
        weight: 25,
        detail: `${pulsePoints} pts • ${votedPolls}/${totalPolls || 1} Polls Voted`,
      },
      {
        id: "networking",
        title: "Networking & Chat",
        category: "networking",
        status: (connectionsCount > 0 || messagesCount > 0 ? "completed" : "pending") as "completed" | "pending",
        weight: 25,
        detail: `${connectionsCount} Connections • ${messagesCount} Messages`,
      },
    ];

    const completedWeight = milestones
      .filter((m) => m.status === "completed")
      .reduce((acc, m) => acc + m.weight, 0);

    const completedCount = milestones.filter((m) => m.status === "completed").length;

    return NextResponse.json({
      success: true,
      attendee: {
        id: attendeeObj?._id || attendeeId,
        name: attendeeObj?.name || decoded.name || "Attendee",
        email: attendeeObj?.email || decoded.email || "",
        avatarUrl: attendeeObj?.avatarUrl || null,
        isCheckedIn,
      },
      ticket: {
        orderId,
        tier: ticketTier,
        status: ticketObj?.status || "valid",
        isCheckedIn,
        checkInTime: ticketObj?.checkInTime || attendeeObj?.checkInTime || null,
      },
      event: eventObj
        ? {
            id: eventObj._id,
            title: eventObj.title,
            location: eventObj.location,
            startDate: eventObj.startDate || eventObj.date || null,
          }
        : null,
      stats: {
        pulsePoints,
        rank,
        connectionsCount,
        pollsTotal: totalPolls,
        pollsVoted: votedPolls,
        messagesCount,
      },
      progress: {
        percentage: completedWeight,
        completedCount,
        totalMilestones: milestones.length,
        milestones,
      },
    });
  } catch (error: any) {
    console.error("Progress Aggregation Error:", error);
    return NextResponse.json({ error: "Failed to load attendee progress" }, { status: 500 });
  }
}
