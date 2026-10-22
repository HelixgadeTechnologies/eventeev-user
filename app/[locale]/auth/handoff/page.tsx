"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  Ticket as TicketIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HandoffData {
  token: string;
  eventId: string;
  attendee: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    isCheckedIn?: boolean;
  };
  ticket: {
    id: string;
    orderId: string;
    tier: string;
    status: string;
    isCheckedIn?: boolean;
  };
  event: {
    id: string;
    title: string;
    location: string;
    startDate?: string | null;
    banner?: string | null;
  } | null;
}

function HandoffContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get("token");
  const eventIdParam = searchParams.get("eventId");
  const ticketRefParam = searchParams.get("ticketRef") || searchParams.get("reference");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [handoffData, setHandoffData] = useState<HandoffData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let isCancelled = false;

    const performHandoff = async () => {
      // 1. Check if token was provided in URL or in existing localStorage
      const activeToken = tokenParam || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const activeEventId = eventIdParam || (typeof window !== "undefined" ? localStorage.getItem("eventId") : null);

      if (!activeToken && !ticketRefParam && !emailParam) {
        setStatus("error");
        setErrorMessage("No valid ticket pass or authorization token detected in this session.");
        return;
      }

      try {
        const res = await fetch("/api/attendee/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: activeToken,
            eventId: activeEventId,
            ticketRef: ticketRefParam,
            email: emailParam,
          }),
        });

        const data = await res.json();

        if (isCancelled) return;

        if (res.ok && data.success) {
          // Persist verified session credentials
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          if (data.eventId) {
            localStorage.setItem("eventId", data.eventId);
          }

          setHandoffData(data);
          setStatus("success");
        } else {
          // If token in localStorage or query parameter was already present, fallback to direct entry
          if (activeToken && activeEventId) {
            localStorage.setItem("token", activeToken);
            localStorage.setItem("eventId", activeEventId);
            router.push("/dashboard");
            return;
          }

          setStatus("error");
          setErrorMessage(data.error || "Unable to activate your event pass. Please verify your ticket reference.");
        }
      } catch (err) {
        if (isCancelled) return;
        setStatus("error");
        setErrorMessage("A network error occurred while activating your pass. Please try again.");
      }
    };

    performHandoff();

    return () => {
      isCancelled = true;
    };
  }, [tokenParam, eventIdParam, ticketRefParam, emailParam, router]);

  // Auto-redirect timer when successful
  useEffect(() => {
    if (status !== "success") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, router]);

  const handleEnterDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-eventeev-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center text-white shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-eventeev-orange/20 flex items-center justify-center text-eventeev-orange">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-eventeev-orange/30 animate-ping pointer-events-none" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Activating Your Pass...</h2>
                <p className="text-white/60 text-xs font-medium mt-1">
                  Verifying your ticket registration and preparing your event workspace.
                </p>
              </div>
            </motion.div>
          )}

          {status === "success" && handoffData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-4"
            >
              {/* Success Badge */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ticket Verified & Activated</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Welcome, {handoffData.attendee.name.split(" ")[0]}!
                </h1>
                <p className="text-white/70 text-xs font-medium">
                  Your official digital pass is ready for entry.
                </p>
              </div>

              {/* Digital Event Ticket Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
                {/* Ticket Header Banner */}
                <div className="bg-gradient-to-r from-eventeev-navy via-slate-900 to-eventeev-navy p-5 text-white relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-eventeev-orange flex items-center gap-1">
                      <TicketIcon className="w-3.5 h-3.5" />
                      Official Event Pass
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {handoffData.ticket.tier}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-snug line-clamp-1">
                    {handoffData.event?.title || "Eventeev Live Experience"}
                  </h3>
                  <div className="flex items-center gap-3 text-white/70 text-xs font-medium mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-eventeev-orange" />
                      {handoffData.event?.startDate
                        ? new Date(handoffData.event.startDate).toLocaleDateString()
                        : "Today"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-eventeev-orange" />
                      {handoffData.event?.location || "Main Venue"}
                    </span>
                  </div>
                </div>

                {/* Perforation Divider Line */}
                <div className="relative flex items-center justify-between px-2 bg-slate-50 py-1">
                  <div className="w-4 h-4 rounded-full bg-slate-900 -ml-4" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
                  <div className="w-4 h-4 rounded-full bg-slate-900 -mr-4" />
                </div>

                {/* Ticket Details Body */}
                <div className="p-5 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Attendee
                      </p>
                      <p className="text-sm font-black text-eventeev-navy">
                        {handoffData.attendee.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                        {handoffData.attendee.email}
                      </p>
                    </div>

                    {/* QR Code graphic */}
                    <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                      <QrCode className="w-full h-full text-eventeev-navy" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Pass Reference
                      </span>
                      <span className="font-mono font-black text-eventeev-orange">
                        {handoffData.ticket.orderId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Status
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Valid
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action & Auto-Redirect Bar */}
              <div className="space-y-2.5">
                <button
                  onClick={handleEnterDashboard}
                  className="w-full py-4 bg-gradient-to-r from-eventeev-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] text-white text-sm font-black rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Enter Event Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-semibold">
                  <span>Redirecting in {countdown}s</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-slate-100 max-w-sm mx-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-eventeev-navy mb-1">
                Pass Activation Failed
              </h2>
              <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                {errorMessage}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 bg-eventeev-navy hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  Return to Event Join Page
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function HandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-eventeev-orange" />
        </div>
      }
    >
      <HandoffContent />
    </Suspense>
  );
}
