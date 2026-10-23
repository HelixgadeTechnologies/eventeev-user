"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  Search,
  LayoutGrid,
  List as ListIcon,
  Download,
  ChevronLeft,
  X,
  Globe,
  Building2,
  BookOpen,
  User,
  Share2,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Inline SVGs for social icons
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface SpeakerItem {
  _id: string;
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  role?: string;
  company?: string;
  bio?: string;
  topic?: string;
  photo?: string;
  socialLinks?: {
    twitter?: string;
    companyTwitter?: string;
    linkedin?: string;
    website?: string;
  };
  sessions?: any[];
}

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerItem | null>(null);
  const [stats, setStats] = useState({
    totalSpeakers: 0,
    sessionsScheduled: 0,
    totalHours: "0 hrs",
  });

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const storedEventId = localStorage.getItem("eventId");
        if (!storedEventId) {
          setLoading(false);
          return;
        }

        // Try local endpoint first
        let response = await fetch(`/api/speaker/event/${storedEventId}`);
        if (!response.ok) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
          response = await fetch(`${API_URL}/api/speaker/event/${storedEventId}`);
        }

        if (response.ok) {
          const data = await response.json();
          const list: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data.speakers)
            ? data.speakers
            : [];

          const normalized = list.map((s: any) => {
            if (typeof s === "string") {
              return {
                _id: String(Math.random()),
                id: String(Math.random()),
                name: s,
                role: "Speaker",
                title: "Speaker",
                bio: "",
                photo: "",
                topic: "Keynote Presentation",
                company: "",
                socialLinks: {},
              };
            }

            const firstName = s.firstName || "";
            const lastName = s.lastName || "";
            const fullName = (s.name || `${firstName} ${lastName}`).trim() || "Event Speaker";

            return {
              _id: String(s._id || s.id || Math.random()),
              id: String(s._id || s.id || Math.random()),
              name: fullName,
              firstName,
              lastName,
              title: s.title || s.role || "Speaker",
              role: s.title || s.role || "Speaker",
              company: s.company || "",
              bio: s.bio || s.description || "",
              topic: s.topic || s.sessionTitle || s.talkTitle || "Keynote Presentation",
              photo: s.photo || s.imageUrl || s.avatar || "",
              socialLinks: {
                twitter:
                  s.socialLinks?.twitter ||
                  s.twitter ||
                  s.twitterUrl ||
                  (s.socialLinks?.companyTwitter ? `@${s.socialLinks.companyTwitter.replace(/^@/, "")}` : "") ||
                  "",
                companyTwitter: s.socialLinks?.companyTwitter || "",
                linkedin: s.socialLinks?.linkedin || s.linkedin || s.linkedinUrl || "",
                website: s.socialLinks?.website || s.website || s.websiteUrl || "",
              },
              sessions: Array.isArray(s.sessions) ? s.sessions : [],
            };
          });

          setSpeakers(normalized);
          setStats({
            totalSpeakers: data.totalSpeakers ?? normalized.length,
            sessionsScheduled:
              data.sessionsScheduled ??
              normalized.reduce((acc: number, sp: any) => acc + (sp.sessions?.length > 0 ? sp.sessions.length : (sp.topic ? 1 : 0)), 0),
            totalHours: data.totalHours || `${Math.max(normalized.length * 2, 2)} hrs`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch speakers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
  }, []);

  const filteredSpeakers = useMemo(() => {
    if (!searchQuery.trim()) return speakers;
    const q = searchQuery.toLowerCase().trim();
    return speakers.filter(
      (sp) =>
        sp.name.toLowerCase().includes(q) ||
        (sp.title && sp.title.toLowerCase().includes(q)) ||
        (sp.role && sp.role.toLowerCase().includes(q)) ||
        (sp.topic && sp.topic.toLowerCase().includes(q)) ||
        (sp.company && sp.company.toLowerCase().includes(q))
    );
  }, [speakers, searchQuery]);

  const handleExportCSV = () => {
    if (!speakers.length) return;
    const headers = ["Name", "Title/Role", "Company", "Presentation Topic", "Twitter", "Bio"];
    const rows = speakers.map((sp) => [
      `"${sp.name.replace(/"/g, '""')}"`,
      `"${(sp.title || sp.role || "").replace(/"/g, '""')}"`,
      `"${(sp.company || "").replace(/"/g, '""')}"`,
      `"${(sp.topic || "").replace(/"/g, '""')}"`,
      `"${(sp.socialLinks?.twitter || "").replace(/"/g, '""')}"`,
      `"${(sp.bio || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventeev_speakers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF5722]" />
        <p className="text-sm font-semibold text-slate-500">Loading Speaker Directory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
      {/* ── Breadcrumb & Title ── */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 tracking-wider uppercase transition-colors mb-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Speaker Directory
        </h1>
      </div>

      {/* ── Metric Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total Speakers */}
        <div className="bg-white rounded-[26px] p-6 border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              TOTAL SPEAKERS
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
              {stats.totalSpeakers}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              ACTIVE PROFILES
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Sessions Scheduled */}
        <div className="bg-white rounded-[26px] p-6 border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              SESSIONS SCHEDULED
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
              {stats.sessionsScheduled}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              HEALTHY
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Calendar className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Total Speaker Hours */}
        <div className="bg-white rounded-[26px] p-6 border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              TOTAL SPEAKER HOURS
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
              {stats.totalHours}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              SCHEDULED TIME
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* ── Search & Controls Toolbar ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl bg-white rounded-full border border-slate-200/80 shadow-sm p-1.5 pl-5 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search speakers, topics, or companies..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {}}
            className="bg-[#E55B3C] hover:bg-[#d44e30] text-white px-6 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all shadow-sm shrink-0"
          >
            Search
          </button>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Grid / List View Toggle */}
          <div className="bg-white rounded-full border border-slate-200/80 p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`p-2 rounded-full transition-colors ${
                viewMode === "grid"
                  ? "bg-[#FFF0E8] text-[#E55B3C]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`p-2 rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-[#FFF0E8] text-[#E55B3C]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-slate-200/80 shadow-sm text-xs font-bold text-slate-700 hover:bg-slate-50 tracking-wider uppercase transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Speakers List / Grid ── */}
      {filteredSpeakers.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center shadow-sm max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 bg-orange-50 text-[#E55B3C] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Speakers Found</h3>
          <p className="text-sm font-medium text-slate-500 mb-6">
            {searchQuery
              ? `No speakers matched your search "${searchQuery}".`
              : "The event organizer has not published any speakers yet."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.map((speaker, index) => (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={speaker._id || index}
              onClick={() => setSelectedSpeaker(speaker)}
              className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
            >
              {/* Card Body */}
              <div className="p-6 md:p-7">
                {/* Top Row: Info on Left, Peach Framed Portrait on Right */}
                <div className="flex items-start justify-between gap-4">
                  {/* Left Column: Name, Role, Twitter */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-[#E55B3C] transition-colors">
                      {speaker.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 tracking-[0.16em] uppercase mt-1">
                      {speaker.role || speaker.title || "SPEAKER"}
                    </p>

                    {/* Twitter Handle */}
                    {speaker.socialLinks?.twitter ? (
                      <a
                        href={
                          speaker.socialLinks.twitter.startsWith("http")
                            ? speaker.socialLinks.twitter
                            : `https://x.com/${speaker.socialLinks.twitter.replace(/^@/, "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E55B3C] hover:text-[#c94528] tracking-wider uppercase mt-2.5 transition-colors"
                      >
                        <TwitterIcon className="w-3.5 h-3.5 shrink-0 fill-current" />
                        <span className="truncate">
                          {speaker.socialLinks.twitter.startsWith("@")
                            ? speaker.socialLinks.twitter.toUpperCase()
                            : `@${speaker.socialLinks.twitter.toUpperCase()}`}
                        </span>
                      </a>
                    ) : (
                      <div className="h-5 mt-2.5" />
                    )}
                  </div>

                  {/* Right Column: Peach container framing the portrait image */}
                  <div className="shrink-0">
                    <div className="bg-[#FFF0E8] p-2.5 rounded-[24px] flex items-center justify-center">
                      <div className="w-[84px] h-[102px] rounded-[18px] overflow-hidden border-2 border-white shadow-[0_8px_18px_-3px_rgba(0,0,0,0.18)] bg-slate-100 relative">
                        <img
                          src={
                            speaker.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              speaker.name
                            )}&background=E55B3C&color=fff&size=256`
                          }
                          alt={speaker.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Presentation Topic */}
                <div className="mt-6">
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 tracking-[0.16em] uppercase mb-1.5">
                    PRESENTATION TOPIC
                  </p>
                  <p className="text-sm md:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">
                    {speaker.topic || "The future of Generative AI in Africa"}
                  </p>
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/40">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpeaker(speaker);
                  }}
                  className="text-[11px] font-bold tracking-widest text-slate-500 hover:text-[#E55B3C] hover:bg-white flex items-center justify-center gap-2 py-3.5 px-4 transition-colors uppercase"
                >
                  <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E55B3C]" />
                  <span>View Bio</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpeaker(speaker);
                  }}
                  className="text-[11px] font-bold tracking-widest text-slate-500 hover:text-[#E55B3C] hover:bg-white flex items-center justify-center gap-2 py-3.5 px-4 transition-colors uppercase"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E55B3C]" />
                  <span>Session</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-4">
          {filteredSpeakers.map((speaker, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              key={speaker._id || index}
              onClick={() => setSelectedSpeaker(speaker)}
              className="bg-white rounded-[26px] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-[#FFF0E8] p-2 rounded-2xl shrink-0">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                    <img
                      src={
                        speaker.photo ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          speaker.name
                        )}&background=E55B3C&color=fff&size=256`
                      }
                      alt={speaker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#E55B3C] transition-colors truncate">
                    {speaker.name}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                    {speaker.role || speaker.title || "SPEAKER"}{" "}
                    {speaker.company ? `• ${speaker.company}` : ""}
                  </p>
                  {speaker.topic && (
                    <p className="text-xs font-semibold text-slate-700 mt-1 line-clamp-1">
                      <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mr-1">
                        Topic:
                      </span>
                      {speaker.topic}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {speaker.socialLinks?.twitter && (
                  <a
                    href={
                      speaker.socialLinks.twitter.startsWith("http")
                        ? speaker.socialLinks.twitter
                        : `https://x.com/${speaker.socialLinks.twitter.replace(/^@/, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-full bg-slate-50 text-slate-500 hover:text-[#E55B3C] hover:bg-[#FFF0E8] transition-colors"
                  >
                    <TwitterIcon className="w-4 h-4 fill-current" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpeaker(speaker);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#E55B3C] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#c94528] transition-colors shadow-sm"
                >
                  View Profile
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Speaker Detail Modal ── */}
      <AnimatePresence>
        {selectedSpeaker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSpeaker(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
            >
              <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Header Banner with Peach Accent & Close */}
                <div className="bg-gradient-to-br from-[#FFF0E8] to-[#FFE3D6] p-6 relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0">
                      <img
                        src={
                          selectedSpeaker.photo ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedSpeaker.name
                          )}&background=E55B3C&color=fff&size=256`
                        }
                        alt={selectedSpeaker.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {selectedSpeaker.name}
                      </h2>
                      <p className="text-xs font-bold text-[#E55B3C] tracking-widest uppercase mt-0.5">
                        {selectedSpeaker.role || selectedSpeaker.title || "SPEAKER"}
                      </p>
                      {selectedSpeaker.company && (
                        <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedSpeaker.company}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-slate-700 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Presentation Topic Box */}
                  <div className="bg-[#FFF8F5] border border-[#FFE7DC] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-[#E55B3C] tracking-widest uppercase mb-1">
                      PRESENTATION TOPIC
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-snug">
                      {selectedSpeaker.topic || "The future of Generative AI in Africa"}
                    </p>
                  </div>

                  {/* Biography */}
                  {selectedSpeaker.bio ? (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                        About Speaker
                      </p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                        {selectedSpeaker.bio}
                      </p>
                    </div>
                  ) : null}

                  {/* Sessions (if any) */}
                  {selectedSpeaker.sessions && selectedSpeaker.sessions.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                        Scheduled Sessions
                      </p>
                      <div className="space-y-2">
                        {selectedSpeaker.sessions.map((sess: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {sess.title || sess.name || "Session"}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {sess.time || sess.date || "Scheduled during event"}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-[#E55B3C] px-2.5 py-1 rounded-full">
                              Confirmed
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                      Connect & Follow
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedSpeaker.socialLinks?.twitter && (
                        <a
                          href={
                            selectedSpeaker.socialLinks.twitter.startsWith("http")
                              ? selectedSpeaker.socialLinks.twitter
                              : `https://x.com/${selectedSpeaker.socialLinks.twitter.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold tracking-wide transition-colors"
                        >
                          <TwitterIcon className="w-3.5 h-3.5 text-[#E55B3C] fill-current" />
                          <span>
                            {selectedSpeaker.socialLinks.twitter.startsWith("@")
                              ? selectedSpeaker.socialLinks.twitter
                              : `@${selectedSpeaker.socialLinks.twitter}`}
                          </span>
                        </a>
                      )}

                      {selectedSpeaker.socialLinks?.linkedin && (
                        <a
                          href={selectedSpeaker.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold tracking-wide transition-colors"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 fill-current" />
                          <span>LinkedIn</span>
                        </a>
                      )}

                      {selectedSpeaker.socialLinks?.website && (
                        <a
                          href={selectedSpeaker.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold tracking-wide transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
