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
  const router = useRouter();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    setStep(2);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/attendee/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: fullName, eventId: code }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        // Here we could store the token in localStorage or cookie
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        console.error("Failed to register:", data);
        setLoading(false);
        alert(data.error || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Error joining event:", error);
      setLoading(false);
      alert("An error occurred. Please try again.");
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
            <Image src="/icons/eventeev-logo.png" alt="Eventeev Logo" width={200} height={60} className="object-contain" />
          </div>
          <p className="text-eventeev-slate text-lg font-medium">
            {step === 1 ? "Enter your event code to join the ecosystem." : "Provide your details to continue."}
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
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="EVENT CODE (e.g. EVT2026)"
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold tracking-widest text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={code.length < 4}
                  className={cn(
                    "w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    code.length >= 4
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
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
                  Back to Event Code
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
    </div>
  );
}
