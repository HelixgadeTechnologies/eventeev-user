"use client";
import { useState, useEffect } from "react";
import { Loader2, Users, X, Globe, Building2, BookOpen, ChevronRight } from "lucide-react";

// Inline SVGs for social icons not available in this lucide-react version
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { motion, AnimatePresence } from "framer-motion";

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const storedEventId = localStorage.getItem("eventId");
        if (!storedEventId) {
          setLoading(false);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
        const response = await fetch(`${API_URL}/api/speaker/event/${storedEventId}`);

        if (response.ok) {
          const data = await response.json();
          const speakersList = Array.isArray(data) ? data : data.speakers || [];

          const normalizedSpeakers = speakersList.map((s: any) => {
            if (typeof s === "string") return { name: s, role: "Speaker", bio: "", photo: "" };

            const name = s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || "Unknown Speaker";
            return {
              ...s,
              name,
              role: s.title || s.role || "Speaker",
              company: s.company || "",
              photo: s.photo || s.imageUrl || "",
              bio: s.bio || s.description || "",
              topic: s.topic || s.sessionTitle || s.talkTitle || "",
              linkedin: s.linkedin || s.linkedinUrl || "",
              twitter: s.twitter || s.twitterUrl || "",
              website: s.website || s.websiteUrl || "",
            };
          });
          setSpeakers(normalizedSpeakers);
        }
      } catch (error) {
        console.error("Failed to fetch speakers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-eventeev-orange" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-eventeev-navy">Event Speakers</h1>
            <p className="text-sm font-medium text-slate-500">Tap a card to view speaker details</p>
          </div>
        </div>

        {speakers.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl premium-shadow border border-slate-100 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-eventeev-navy mb-2">No Speakers Listed</h3>
            <p className="text-slate-500 font-medium">The organizer hasn&apos;t added any speakers for this event yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {speakers.map((speaker, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                key={i}
                onClick={() => setSelectedSpeaker(speaker)}
                className="bg-white rounded-3xl premium-shadow border border-slate-100 overflow-hidden group cursor-pointer hover:border-eventeev-orange/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                  <img
                    src={
                      speaker.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=FF6B35&color=fff&size=256`
                    }
                    alt={speaker.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
                    <span className="text-white text-xs font-bold bg-eventeev-orange px-3 py-1.5 rounded-full flex items-center gap-1">
                      View Profile <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-black text-eventeev-navy mb-1 line-clamp-1">{speaker.name}</h3>
                  <p className="text-sm font-bold text-eventeev-orange mb-3 line-clamp-1">
                    {speaker.role}
                    {speaker.company ? ` • ${speaker.company}` : ""}
                  </p>
                  {speaker.topic && (
                    <p className="text-xs font-semibold text-slate-400 line-clamp-1 mb-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 shrink-0" /> {speaker.topic}
                    </p>
                  )}
                  {speaker.bio && (
                    <p className="text-sm font-medium text-slate-500 line-clamp-2">{speaker.bio}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sheet / Modal */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
            >
              <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto pointer-events-auto shadow-2xl">

                {/* Hero image */}
                <div className="relative h-56 shrink-0 overflow-hidden">
                  <img
                    src={
                      selectedSpeaker.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSpeaker.name)}&background=FF6B35&color=fff&size=512`
                    }
                    alt={selectedSpeaker.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Close */}
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-6 pb-10">
                  <h2 className="text-2xl font-black text-eventeev-navy">{selectedSpeaker.name}</h2>
                  <p className="text-sm font-bold text-eventeev-orange mt-1">{selectedSpeaker.role}</p>

                  {selectedSpeaker.company && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-semibold text-slate-500">{selectedSpeaker.company}</p>
                    </div>
                  )}

                  {selectedSpeaker.topic && (
                    <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-eventeev-orange uppercase tracking-wide mb-1">Session Topic</p>
                      <p className="text-sm font-semibold text-eventeev-navy">{selectedSpeaker.topic}</p>
                    </div>
                  )}

                  {selectedSpeaker.bio && (
                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">About</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedSpeaker.bio}</p>
                    </div>
                  )}

                  {(selectedSpeaker.linkedin || selectedSpeaker.twitter || selectedSpeaker.website) && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {selectedSpeaker.linkedin && (
                        <a
                          href={selectedSpeaker.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <LinkedinIcon className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {selectedSpeaker.twitter && (
                        <a
                          href={selectedSpeaker.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 border border-sky-100 rounded-2xl text-sm font-bold text-sky-500 hover:bg-sky-100 transition-colors"
                        >
                          <TwitterIcon className="w-4 h-4" /> Twitter / X
                        </a>
                      )}
                      {selectedSpeaker.website && (
                        <a
                          href={selectedSpeaker.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Globe className="w-4 h-4" /> Website
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
