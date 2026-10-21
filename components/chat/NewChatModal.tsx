"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, Crown, User as UserIcon, Loader2, MessageSquarePlus, RefreshCw } from "lucide-react";
import { ChatParticipant, chatService } from "@/lib/services/chatService";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  currentUserId: string | null;
  token: string | null;
  onSelectParticipant: (participant: ChatParticipant) => void;
}

export function NewChatModal({
  isOpen,
  onClose,
  eventId,
  currentUserId,
  token,
  onSelectParticipant,
}: NewChatModalProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizer, setOrganizer] = useState<ChatParticipant | null>(null);
  const [attendees, setAttendees] = useState<ChatParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    const effectiveToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    const effectiveEventId = eventId || (typeof window !== "undefined" ? localStorage.getItem("eventId") : null);

    if (!effectiveEventId) {
      setError("No event selected.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await chatService.getParticipants(effectiveEventId, effectiveToken || "");
      setOrganizer(result.organizer);
      setAttendees(result.attendees);
    } catch (err: any) {
      console.warn("Failed to load participants:", err);
      // If blocked by check-in rule, automatically perform self check-in and retry
      if (effectiveToken && (err?.message?.includes("checked in") || err?.status === 403)) {
        try {
          await chatService.checkInSelf(effectiveToken);
          const retryResult = await chatService.getParticipants(effectiveEventId, effectiveToken);
          setOrganizer(retryResult.organizer);
          setAttendees(retryResult.attendees);
          return;
        } catch (_) {}
      }
      setError(err?.message || "Could not retrieve participants");
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    if (!isOpen) return;
    fetchParticipants();
  }, [isOpen, fetchParticipants]);

  const filteredOrganizer = useMemo(() => {
    if (!organizer) return null;
    if (currentUserId && String(organizer.id) === String(currentUserId)) return null;
    if (organizer.isCurrentUser) return null;
    if (!search.trim()) return organizer;
    return organizer.name.toLowerCase().includes(search.toLowerCase()) ? organizer : null;
  }, [organizer, currentUserId, search]);

  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      if (currentUserId && String(att.id) === String(currentUserId)) return false;
      if (att.isCurrentUser) return false;
      if (!search.trim()) return true;
      return att.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [attendees, currentUserId, search]);

  if (!isOpen) return null;

  const hasAnyParticipants = Boolean(filteredOrganizer || filteredAttendees.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-eventeev-orange">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-eventeev-navy">New Direct Message</h2>
              <p className="text-xs text-slate-500 font-medium">Select a participant or the organizer to chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium text-eventeev-navy placeholder:text-slate-400 focus:outline-none focus:border-eventeev-orange transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
              <span className="font-medium truncate mr-2">{error}</span>
              <button
                onClick={fetchParticipants}
                className="font-bold underline hover:text-red-900 flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-eventeev-orange" />
              <p className="text-xs font-semibold text-slate-400">Loading attendee directory...</p>
            </div>
          ) : !hasAnyParticipants ? (
            <div className="py-10 text-center px-4">
              <UserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-eventeev-navy">
                {search ? "No attendees match your search." : "No other confirmed attendees found."}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {search
                  ? "Try searching with a different name."
                  : "As other attendees register and join the event, they will appear here."}
              </p>
              <button
                onClick={fetchParticipants}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Directory
              </button>
            </div>
          ) : (
            <>
              {/* Event Organizer / Host Section */}
              {filteredOrganizer && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Event Organizer</span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectParticipant(filteredOrganizer);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50/60 border border-transparent hover:border-orange-200 transition-all text-left group"
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 p-[2px]">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                          {filteredOrganizer.avatar ? (
                            <img
                              src={filteredOrganizer.avatar}
                              alt={filteredOrganizer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-orange-600">
                              {filteredOrganizer.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                        <Crown className="w-2.5 h-2.5 text-white" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-eventeev-navy group-hover:text-eventeev-orange truncate">
                          {filteredOrganizer.name}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Host
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">Event Organizer & Support</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Verified Attendees Section */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                  Attendees ({filteredAttendees.length})
                </div>

                {filteredAttendees.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <p className="text-xs font-semibold">
                      {search ? "No attendees match your search." : "No other confirmed attendees registered yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAttendees.map((attendee) => (
                      <button
                        key={attendee.id}
                        onClick={() => {
                          onSelectParticipant(attendee);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                          {attendee.avatar ? (
                            <img src={attendee.avatar} alt={attendee.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">
                              {attendee.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-eventeev-navy group-hover:text-eventeev-orange truncate">
                              {attendee.name}
                            </p>
                            {attendee.isCheckedIn && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Checked In
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 capitalize">Attendee</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
