"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
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
          <div className="w-20 h-20 bg-eventeev-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-6 premium-shadow">
            <ShieldCheck className="w-10 h-10 text-eventeev-orange" />
          </div>
          <h1 className="text-4xl font-extrabold text-eventeev-navy mb-3 tracking-tight">
            Eventeev <span className="text-eventeev-orange">Attendee</span>
          </h1>
          <p className="text-eventeev-slate text-lg font-medium">
            Enter your event code to join the ecosystem.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
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
            disabled={code.length < 4 || loading}
            className={cn(
              "w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
              code.length >= 4 && !loading
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
        </form>

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
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 px-8">
        <p className="text-slate-400 text-xs font-medium">
          By joining, you agree to our <span className="text-slate-600 underline font-bold">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}
