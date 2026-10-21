"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users } from "lucide-react";

interface KahootGameCountdownProps {
  count: number;
  pin: string;
  totalParticipants?: number;
}

export function KahootGameCountdown({
  count,
  pin,
  totalParticipants = 1
}: KahootGameCountdownProps) {
  // Mobile haptic vibration on count tick
  useEffect(() => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(45);
      } catch {
        // Ignore vibration errors
      }
    }
  }, [count]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden select-none">
      {/* Dynamic Background Circles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full border-4 border-dashed border-white/40"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border-4 border-dashed border-white/30"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-gradient-to-b from-[#EB5017] to-[#D84310] text-white p-8 md:p-12 rounded-[36px] shadow-2xl border border-white/20 flex flex-col items-center relative z-10"
      >
        {/* Top Header Badge */}
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 border border-white/10 text-xs font-black uppercase tracking-widest text-white/90">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>Game Starting • Room {pin || "---"}</span>
        </div>

        <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white/80 mb-2">
          Get Ready!
        </h3>

        <p className="text-white/70 font-bold text-sm mb-8">
          The competition is about to begin...
        </p>

        {/* Circular Countdown Ring */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-8">
          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-full bg-white/15 blur-2xl" />

          {/* Glowing Ring Frame */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-4 rounded-full border border-white/20" />

          {/* Large Countdown Number */}
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.4, opacity: 0, rotate: 20 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
              className="text-8xl md:text-9xl font-black text-white leading-none drop-shadow-2xl font-mono"
              style={{ textShadow: "0 0 40px rgba(255, 255, 255, 0.6)" }}
            >
              {count}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Players Indicator */}
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-wider text-white/90">
          <Users className="w-4 h-4 text-emerald-300" />
          <span>{totalParticipants} {totalParticipants === 1 ? "Player" : "Players"} Live & Synced</span>
        </div>
      </motion.div>
    </div>
  );
}
