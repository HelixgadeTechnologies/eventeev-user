"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Bell, 
  Trophy, 
  Zap, 
  ArrowRight, 
  FileText, 
  Download, 
  Link as LinkIcon, 
  Loader2, 
  X, 
  CheckCircle2, 
  Crown, 
  MessageSquare,
  Ticket,
  QrCode,
  Clock,
  Users,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { MOCK_EVENT } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const c = useTranslations('Common');
  
  const [eventData, setEventData] = useState<any>(null);
  const [attendeeData, setAttendeeData] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedEventId = localStorage.getItem("eventId");
        const token = localStorage.getItem("token");

        // Fetch attendee & ticket details
        if (token) {
          try {
            const meRes = await fetch("/api/attendee/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              setAttendeeData(meData.user || meData.attendee);
              setTicketData(meData.ticket || null);
            }
          } catch (e) {
            console.warn("Could not fetch attendee details:", e);
          }
        }

        if (storedEventId) {
          const response = await fetch(`/api/event/public/${storedEventId}`);
          const data = await response.json();
          const eventInfo = data.event || (data._id ? data : null);
          if (response.ok && eventInfo) {
            setEventData(eventInfo);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  const organizerName =
    eventData?.owner?.name ||
    `${eventData?.owner?.firstName || ""} ${eventData?.owner?.lastName || ""}`.trim() ||
    eventData?.owner?.orgName ||
    eventData?.organizer?.name ||
    "Event Organizer";

  const isCheckedIn = Boolean(attendeeData?.isCheckedIn || ticketData?.isCheckedIn);
  const ticketOrderId =
    ticketData?.orderId ||
    (attendeeData?._id ? `ORD-${attendeeData._id.slice(-6).toUpperCase()}` : "ORD-PASS");
  const ticketTier = ticketData?.tier || "General Admission";
  const pulseScore = attendeeData?.points ?? 450;
  const attendeeRank = attendeeData?.rank ? `#${attendeeData.rank}` : "#12";
  const attendeeName = attendeeData?.name || "Attendee";

  const milestones = [
    {
      id: "ticket",
      title: "Ticket Confirmed",
      subtitle: `${ticketTier} • ${ticketOrderId}`,
      status: "completed" as const,
      icon: Ticket,
      actionText: "View Pass",
      onAction: () => setShowPassModal(true),
    },
    {
      id: "checkin",
      title: "Venue Check-In",
      subtitle: isCheckedIn ? "Checked in at Venue" : "Show QR badge at entrance",
      status: (isCheckedIn ? "completed" : "pending") as "completed" | "pending",
      icon: QrCode,
      actionText: isCheckedIn ? "Verified ✓" : "Show Badge",
      onAction: () => setShowPassModal(true),
    },
    {
      id: "trivia",
      title: "Pulse & Trivia",
      subtitle: `${pulseScore} pts earned (${attendeeRank})`,
      status: (pulseScore > 0 ? "completed" : "pending") as "completed" | "pending",
      icon: Zap,
      actionText: "Play Now",
      href: "/dashboard/games",
    },
    {
      id: "networking",
      title: "Attendee Network",
      subtitle: "Discover checked-in peers",
      status: "completed" as const,
      icon: Users,
      actionText: "Connect",
      href: "/dashboard/networking",
    },
  ];

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-72 w-full overflow-hidden rounded-b-[3rem] shadow-2xl">
        <img
          src={eventData?.thumbnailImage || eventData?.bannerImage || eventData?.bannerUrl || MOCK_EVENT.banner}
          alt={eventData?.title || MOCK_EVENT.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-eventeev-navy/90 via-eventeev-navy/40 to-transparent" />
        
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">{c('liveNow')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-8 right-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-white leading-tight mb-2"
          >
            {eventData?.title || MOCK_EVENT.title}
          </motion.h1>
          <p className="text-white/80 text-sm font-medium flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-eventeev-orange" /> {eventData?.startDate ? new Date(eventData.startDate).toLocaleDateString() : MOCK_EVENT.date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-eventeev-orange" /> {eventData?.location || MOCK_EVENT.location}</span>
          </p>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Attendee Event Journey & Progress Hub */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-eventeev-orange">
                  <Sparkles className="w-3 h-3" />
                  Your Event Journey
                </span>
                <span className="font-mono text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {ticketOrderId}
                </span>
              </div>
              <h2 className="text-2xl font-black text-eventeev-navy">
                Welcome, {attendeeName}!
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {isCheckedIn ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Checked In at Venue
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPassModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  Check-in Pending • Show QR
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar & Milestone Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-slate-500 uppercase tracking-wider">
                Event Progress: {completedCount} of {milestones.length} Milestones Completed
              </span>
              <span className="text-eventeev-orange font-black text-sm">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-eventeev-orange via-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* Interactive Milestone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {milestones.map((milestone) => {
              const Icon = milestone.icon;
              const isDone = milestone.status === "completed";
              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col justify-between text-left",
                    isDone
                      ? "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:shadow-md"
                      : "bg-amber-50/40 border-amber-200/80 hover:bg-white hover:shadow-md"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                          isDone
                            ? "bg-white text-eventeev-navy shadow-xs border border-slate-100"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        <Icon className="w-5 h-5 text-eventeev-orange" />
                      </div>
                      {isDone ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping mt-1 mr-1" />
                      )}
                    </div>

                    <h4 className="text-sm font-black text-eventeev-navy leading-tight">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">
                      {milestone.subtitle}
                    </p>
                  </div>

                  <div className="mt-4">
                    {milestone.href ? (
                      <Link
                        href={milestone.href}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-eventeev-orange rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>{milestone.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={milestone.onAction}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs",
                          isDone
                            ? "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-eventeev-orange"
                            : "bg-eventeev-orange hover:bg-orange-600 text-white"
                        )}
                      >
                        <span>{milestone.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organizer / Event Host Quick Contact Banner */}
        <Link
          href="/dashboard/chat?chatWith=organizer"
          className="block p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 hover:from-amber-500/15 hover:via-orange-500/15 hover:to-amber-500/10 rounded-3xl border border-orange-200/80 shadow-sm transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-eventeev-orange p-0.5 shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                    {eventData?.owner?.avatar ? (
                      <img
                        src={eventData.owner.avatar}
                        alt={organizerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black text-eventeev-orange">
                        {organizerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-eventeev-navy group-hover:text-eventeev-orange transition-colors truncate">
                    {organizerName}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
                    Host
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Have questions about the event? Tap to chat directly with the organizer.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-eventeev-orange group-hover:bg-orange-600 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat with Host</span>
              <span className="sm:hidden">Chat</span>
            </div>
          </div>
        </Link>

        {/* Engagement Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5 text-eventeev-orange" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('yourRank')}</p>
            <p className="text-2xl font-black text-eventeev-navy">#12</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 bg-eventeev-navy rounded-3xl shadow-xl"
          >
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-eventeev-orange" />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{t('pulseScore')}</p>
            <p className="text-2xl font-black text-white">450</p>
          </motion.div>
        </div>

        {/* Schedule Preview */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('currentSchedule')}</h2>
            <Link href="/dashboard/schedule" className="text-eventeev-orange font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
              {t('fullAgenda')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {eventData?.schedule && eventData.schedule.length > 0 ? (
              eventData.schedule.map((item: any, i: number) => (
                <motion.div 
                  key={item.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-5 rounded-3xl flex items-center gap-6 border transition-all duration-300",
                    i === 0 ? "bg-white border-eventeev-orange shadow-lg" : "bg-slate-50 border-transparent"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{item.endTime ? 'END' : 'TIME'}</span>
                    <span className="text-lg font-black text-eventeev-navy leading-none">{item.startTime || 'TBD'}</span>
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-bold", i === 0 ? "text-eventeev-orange" : "text-eventeev-navy")}>
                      {item.title || item.activity}
                    </p>
                    {item.speakers && item.speakers.length > 0 && (
                      <p className="text-xs text-slate-500 font-medium mt-1">By {item.speakers[0].name}</p>
                    )}
                    {i === 0 && <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">{t('happeningNow')}</p>}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Schedule Coming Soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Trivia Callout */}
        <Link 
          href="/dashboard/games"
          className="block p-6 bg-gradient-to-br from-eventeev-orange to-orange-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Zap className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2">{t('triviaCalloutTitle')}</h3>
            <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed">
              {t('triviaCalloutDescription')}
            </p>
            <div className="inline-block bg-white text-eventeev-orange px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">
              {t('startTrivia')}
            </div>
          </div>
        </Link>

        {/* Games Hub Section */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('gamesHub')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/games" className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100 group">
              <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-eventeev-orange group-hover:text-white transition-colors">
                <Zap className="w-5 h-5 text-eventeev-orange group-hover:text-white" />
              </div>
              <p className="text-sm font-black text-eventeev-navy">{t('dailyTrivia')}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t('winPoints')}</p>
            </Link>
            <Link href="/dashboard/games" className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100 group">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Trophy className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-black text-eventeev-navy">{t('leaderboard')}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t('viewRankings')}</p>
            </Link>
          </div>
        </div>

        {/* Resources Section */}
        <div className="pb-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('eventResources')}</h2>
            <Link href="/dashboard/resources" className="text-eventeev-orange font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
              {t('viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {eventData?.resources && eventData.resources.length > 0 ? (
              eventData.resources.map((res: any, i: number) => (
                <motion.div 
                  key={res.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white rounded-3xl border border-slate-100 premium-shadow flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                      {res.type === "PDF" ? <FileText className="w-5 h-5 text-red-500" /> : 
                       res.type === "Link" ? <LinkIcon className="w-5 h-5 text-blue-500" /> :
                       <Download className="w-5 h-5 text-eventeev-orange" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-eventeev-navy">{res.title || res.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase">{res.type || 'Doc'} • {res.size || 'N/A'}</p>
                    </div>
                  </div>
                  {res.url ? (
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-eventeev-orange hover:bg-orange-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link 
                      href="/dashboard/resources"
                      className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-eventeev-orange hover:bg-orange-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No resources uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Drawer/Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-eventeev-orange" />
                  <h3 className="text-lg font-bold text-eventeev-navy">Notifications</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-eventeev-orange text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-eventeev-navy">Welcome to Eventeev!</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Explore sessions, chat with attendees, and participate in live polls.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-full mt-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digital Ticket Pass Modal */}
      <AnimatePresence>
        {showPassModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden text-center relative border border-slate-100 p-6"
            >
              <button
                type="button"
                onClick={() => setShowPassModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-eventeev-orange mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Ticket className="w-7 h-7" />
              </div>

              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-100 text-eventeev-orange inline-block mb-2">
                {ticketTier}
              </span>

              <h3 className="text-xl font-black text-eventeev-navy">
                {eventData?.title || "Event Pass"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {attendeeName} • {attendeeData?.email || "Attendee"}
              </p>

              {/* Scannable Pass Box */}
              <div className="my-5 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                <div className="w-36 h-36 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative">
                  <QrCode className="w-full h-full text-eventeev-navy" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Order Reference
                  </span>
                  <span className="font-mono text-base font-black text-eventeev-navy tracking-wider">
                    {ticketOrderId}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/auth/handoff?welcome=false&orderId=${encodeURIComponent(ticketOrderId)}`}
                  className="w-full py-3 bg-eventeev-orange hover:bg-orange-600 active:scale-[0.98] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Digital Badge
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

