"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Ticket, ArrowRight, QrCode, X, Calendar, Sparkles, LogIn, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const paramEventId = searchParams.get("eventId") || searchParams.get("code");
    const paramEmail = searchParams.get("email");
    const paramOrderId = searchParams.get("orderId") || searchParams.get("ticketRef");

    if (paramEventId) setEventCode(paramEventId);
    if (paramEmail) setEmail(paramEmail);
    if (paramOrderId) setOrderId(paramOrderId);

    // If active token exists, verify and offer instant access
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      fetch("/api/attendee/me", {
        headers: { Authorization: `Bearer ${existingToken}` },
      })
        .then((res) => {
          if (res.ok) {
            router.push("/dashboard");
          }
        })
        .catch(() => {});
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanOrderId = orderId.trim();
    const cleanEventCode = eventCode.trim();

    if (!cleanEmail && !cleanOrderId) {
      setError("Please enter either your email address or your ticket order reference.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/attendee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail || undefined,
          orderId: cleanOrderId || undefined,
          ticketRef: cleanOrderId || undefined,
          eventId: cleanEventCode || undefined,
          code: cleanEventCode || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem("token", data.token);
        if (data.eventId) {
          localStorage.setItem("eventId", data.eventId);
        }

        router.push(
          `/auth/handoff?token=${encodeURIComponent(data.token)}&eventId=${encodeURIComponent(
            data.eventId || ""
          )}&orderId=${encodeURIComponent(data.ticket?.orderId || cleanOrderId)}&welcome=true`
        );
      } else {
        setError(
          data.error ||
            data.message ||
            "No registered ticket found matching these credentials. Please check your details or register for the event."
        );
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Failed to sign in. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-8 text-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mb-16"
      >
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block mx-auto mb-6">
            <Image
              src="/icons/eventeev-logo.png"
              alt="Eventeev Logo"
              width={180}
              height={55}
              className="object-contain"
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-eventeev-orange mb-2">
            <Sparkles className="w-3 h-3" />
            Attendee Portal
          </div>
          <h1 className="text-2xl font-black text-eventeev-navy">Sign In to Event</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Access your digital event pass, live schedule & progress
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-semibold text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 px-1 flex items-center justify-between">
                <span>Ticket / Order Reference</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional if email entered</span>
              </label>
              <div className="relative">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  placeholder="e.g. ORD-B8A1C2"
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-mono font-bold text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 px-1 flex items-center justify-between">
                <span>Event ID or Code</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  placeholder="e.g. CHRI-TMUX or event ID"
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium px-1 leading-relaxed">
            Enter the email address you used when booking your ticket or your 6-character order code from your receipt.
          </p>

          <button
            type="submit"
            disabled={(!email.trim() && !orderId.trim()) || loading}
            className={cn(
              "w-full h-16 mt-2 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl cursor-pointer",
              (email.trim() || orderId.trim()) && !loading
                ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In & Open Pass</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-eventeev-orange transition-colors"
            >
              Don't have a ticket yet? Register / Join Event →
            </Link>
          </div>
        </form>

        {/* QR Code Scanner Option */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-slate-100" />
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">or badge scan</span>
          <div className="h-[1px] flex-1 bg-slate-100" />
        </div>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="mt-6 flex items-center gap-3 mx-auto px-6 py-3 bg-white border border-slate-200 rounded-full shadow-xs hover:shadow-md transition-all text-slate-600 font-bold cursor-pointer text-sm"
        >
          <QrCode className="w-5 h-5 text-eventeev-orange" />
          Scan Badge QR Code
        </button>
      </motion.div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQrModal && (
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center relative"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-eventeev-orange mx-auto flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-eventeev-navy mb-2">QR Badge Scanner</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                Hold your camera over the event badge or QR code on your receipt.
              </p>
              <div className="w-full h-40 bg-slate-900 rounded-2xl flex items-center justify-center text-white/50 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 border-2 border-eventeev-orange border-dashed m-4 rounded-xl animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Camera Viewfinder
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-3.5 bg-eventeev-navy text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Scanner
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-5">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-eventeev-navy mb-2">Credentials Not Found</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">{error}</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="w-full h-12 bg-eventeev-navy text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <Link
                  href="/"
                  className="block w-full py-2.5 text-eventeev-orange font-bold text-xs hover:underline cursor-pointer"
                >
                  Register New Ticket
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
