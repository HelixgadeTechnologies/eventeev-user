"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { KAHOOT_THEME } from "./KahootOptionGrid";
import { cn } from "@/lib/utils";

interface KahootAnswerLockedProps {
  selectedOptionIndex: number;
  optionText?: string;
  timeLeft: number;
}

export function KahootAnswerLocked({
  selectedOptionIndex,
  optionText,
  timeLeft
}: KahootAnswerLockedProps) {
  const theme = KAHOOT_THEME[selectedOptionIndex] || KAHOOT_THEME[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-4 text-center"
    >
      <div className="bg-white p-8 md:p-12 rounded-3xl premium-shadow border border-slate-100 max-w-md w-full flex flex-col items-center">
        {/* Animated Badge of the chosen option */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl text-white relative",
            theme.bgClass
          )}
        >
          {theme.shape}
          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-white" />
          </div>
        </motion.div>

        <h3 className="text-2xl md:text-3xl font-black text-eventeev-navy mb-2">
          Answer Locked In!
        </h3>

        {optionText && (
          <p className="text-slate-600 font-bold text-base md:text-lg mb-6 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 max-w-sm">
            &ldquo;{optionText}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-eventeev-orange" />
          <span>
            {timeLeft > 0 ? `Waiting for time up (${timeLeft}s)...` : "Revealing answer..."}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
