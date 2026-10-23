import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Speaker from "@/lib/models/Speaker";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ speakers: [], totalSpeakers: 0, sessionsScheduled: 0, totalHours: "0 hrs" });
    }

    await dbConnect();

    // 1. Look up Event for organizer details (avatar fallback)
    let organizerAvatar: string | null = null;
    let organizerName: string = "";
    try {
      if (mongoose.isValidObjectId(eventId)) {
        const eventDoc: any = await Event.findById(eventId).populate({
          path: "owner",
          model: User,
          strictPopulate: false,
        });
        if (eventDoc?.owner) {
          organizerAvatar = eventDoc.owner.avatar || null;
          organizerName = (
            eventDoc.owner.name ||
            `${eventDoc.owner.firstName || ""} ${eventDoc.owner.lastName || ""}`
          ).trim();
        }
      }
    } catch (e) {
      console.warn("Event owner lookup in speaker route failed:", e);
    }

    // 2. Fetch from MongoDB speakers collection first
    let dbSpeakers: any[] = [];
    try {
      const eventObjId = mongoose.isValidObjectId(eventId)
        ? new mongoose.Types.ObjectId(eventId)
        : null;

      const queryConditions: any[] = [{ eventId: eventId }];
      if (eventObjId) {
        queryConditions.push({ eventId: eventObjId });
      }

      dbSpeakers = await Speaker.find({ $or: queryConditions }).lean();
    } catch (e) {
      console.warn("MongoDB speakers lookup failed:", e);
    }

    // 3. Fallback to upstream API if DB speakers is empty
    let rawSpeakers: any[] = dbSpeakers;
    if (rawSpeakers.length === 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/speaker/event/${eventId}`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          rawSpeakers = Array.isArray(data) ? data : data.speakers || [];
        }
      } catch (e) {
        console.warn("Upstream speaker fetch failed:", e);
      }
    }

    // 4. Normalize speakers
    const normalizedSpeakers = rawSpeakers.map((s: any) => {
      const firstName = s.firstName || "";
      const lastName = s.lastName || "";
      const fullName = (s.name || `${firstName} ${lastName}`).trim() || "Event Speaker";
      
      let photo = s.photo || s.imageUrl || s.avatar || "";
      // If photo is placeholder or empty, fallback to organizer avatar if matching or available
      if (!photo || photo === "/speaker-avatar.png") {
        if (
          organizerAvatar &&
          (fullName.toLowerCase().includes("godfrey") ||
            (organizerName && fullName.toLowerCase().includes(organizerName.toLowerCase())))
        ) {
          photo = organizerAvatar;
        } else if (organizerAvatar && rawSpeakers.length === 1) {
          photo = organizerAvatar;
        }
      }

      const twitterHandle =
        s.socialLinks?.twitter ||
        s.twitter ||
        s.twitterUrl ||
        (s.socialLinks?.companyTwitter ? `@${s.socialLinks.companyTwitter.replace(/^@/, "")}` : "") ||
        "";

      return {
        _id: String(s._id || Math.random()),
        id: String(s._id || Math.random()),
        name: fullName,
        firstName,
        lastName,
        title: s.title || s.role || "Speaker",
        role: s.title || s.role || "Speaker",
        company: s.company || "",
        bio: s.bio || s.description || "",
        topic: s.topic || s.sessionTitle || s.talkTitle || "Keynote Presentation",
        photo,
        socialLinks: {
          twitter: twitterHandle,
          companyTwitter: s.socialLinks?.companyTwitter || "",
          linkedin: s.socialLinks?.linkedin || s.linkedin || s.linkedinUrl || "",
          website: s.socialLinks?.website || s.website || s.websiteUrl || "",
        },
        sessions: Array.isArray(s.sessions) ? s.sessions : [],
      };
    });

    const totalSpeakers = normalizedSpeakers.length;
    const sessionsScheduled = normalizedSpeakers.reduce(
      (acc, sp) => acc + (sp.sessions?.length > 0 ? sp.sessions.length : (sp.topic ? 1 : 0)),
      0
    );
    const totalHours = `${Math.max(sessionsScheduled * 2, 2)} hrs`;

    return NextResponse.json({
      speakers: normalizedSpeakers,
      totalSpeakers,
      sessionsScheduled,
      totalHours,
    });
  } catch (error) {
    console.error("Speaker Route Error:", error);
    return NextResponse.json({ speakers: [], totalSpeakers: 0, sessionsScheduled: 0, totalHours: "0 hrs" }, { status: 500 });
  }
}
