"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, ArrowRight, ShieldCheck, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JoinPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 5) return;
    
    setLoadingEvent(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/event/public/${code}`);
      const data = await response.json();
      
      // The local API returns { event: {...} }, but the live backend returns the event object directly (with _id)
      const eventData = data.event || (data._id ? data : null);
      
      if (response.ok && eventData) {
        setEventDetails(eventData);
        setStep(2);
      } else {
        setError(data.message || data.error || "Event not found. Please check the ID.");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Failed to verify event. Please try again.");
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/attendee/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: fullName, eventId: eventDetails?._id || eventDetails?.id || code }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        // Here we could store the token in localStorage or cookie
        localStorage.setItem("token", data.token);
        const actualEventId = eventDetails?._id || eventDetails?.id || code;
        if (actualEventId) {
          localStorage.setItem("eventId", actualEventId);
        }
        router.push("/dashboard");
      } else {
        console.error("Failed to register:", data);
        setLoading(false);
        setError(data.error || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error("Error joining event:", err);
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="mb-12">
          <div className="flex items-center justify-center mx-auto mb-6">
            <Image src="/icons/eventeev-logo.png" alt="Eventeev Logo" width={200} height={60} className="object-contain" priority style={{ width: 'auto', height: 'auto' }} />
          </div>
          <p className="text-eventeev-slate text-lg font-medium">
            {step === 1 ? "Enter your Event ID to join the ecosystem." : "Provide your details to continue."}
          </p>
        </div>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleNextStep}
                className="space-y-6 absolute w-full"
              >
                <div className="relative group">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="EVENT ID (e.g. 60d5ec...)"
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold tracking-widest text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={code.length < 5 || loadingEvent}
                  className={cn(
                    "w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    code.length >= 5 && !loadingEvent
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loadingEvent ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleJoin}
                className="space-y-4 absolute w-full"
              >
                {eventDetails && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-1 mb-4 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Joining Event</p>
                    <p className="text-eventeev-navy font-bold text-lg leading-tight truncate">{eventDetails.title}</p>
                    <div className="flex flex-col gap-1 mt-2 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-eventeev-orange" /> {new Date(eventDetails.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-2 truncate"><div className="w-1.5 h-1.5 rounded-full bg-eventeev-orange" /> {eventDetails.location}</span>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300"
                    required
                  />
                </div>
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!fullName || !email || loading}
                  className={cn(
                    "w-full h-16 mt-2 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    fullName && email && !loading
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Join Event
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
                >
                  Back to Event ID
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {step === 1 && (
          <>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-100" />
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">or scan</span>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 flex items-center gap-3 mx-auto px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 font-bold"
            >
              <QrCode className="w-5 h-5 text-eventeev-orange" />
              Scan QR Code
            </motion.button>
          </>
        )}
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 px-8">
        <p className="text-slate-400 text-xs font-medium">
          By joining, you agree to our <span className="text-slate-600 underline font-bold">Terms of Service</span>.
        </p>
      </div>

      {/* Custom Error Modal */}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 opacity-0 hidden" />
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-eventeev-navy mb-3">Oops!</h3>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-full h-14 bg-eventeev-navy text-white rounded-2xl font-bold text-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-xl shadow-slate-900/10"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
