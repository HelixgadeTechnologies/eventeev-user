"use client";

import { motion } from "framer-motion";
import { Timer, Flame, Trophy, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface KahootQuestionHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  timeLeft: number;
  maxTime: number;
  score: number;
  streak: number;
  onExit?: () => void;
}

export function KahootQuestionHeader({
  questionNumber,
  totalQuestions,
  questionText,
  timeLeft,
  maxTime,
  score,
  streak,
  onExit
}: KahootQuestionHeaderProps) {
  const percentLeft = Math.max(0, Math.min(100, (timeLeft / (maxTime || 15)) * 100));
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-3.5 mb-3 sm:mb-5">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Exit Game"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl">
            Q {questionNumber} of {totalQuestions}
          </span>
        </div>

        {/* Score & Streak Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-black"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{streak}x</span>
            </motion.div>
          )}

          <div className="flex items-center gap-1 bg-orange-50 text-eventeev-orange border border-orange-200/80 px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs md:text-sm font-black shadow-xs">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-eventeev-orange" />
            <span>{score.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* Progress & Countdown Bar */}
      <div className="relative w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            isUrgent ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-eventeev-orange to-amber-500"
          )}
          style={{ width: `${percentLeft}%` }}
          transition={{ ease: "linear", duration: 0.3 }}
        />
      </div>

      {/* Question Text Box + Circular Countdown Badge */}
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-eventeev-navy leading-snug flex-1">
          {questionText}
        </h2>

        {/* Circular Countdown Timer */}
        <div
          className={cn(
            "flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-sm",
            isUrgent
              ? "bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/40"
              : "bg-eventeev-navy text-white"
          )}
        >
          <span className="text-base sm:text-lg leading-none">{timeLeft}</span>
          <span className="text-[8px] uppercase tracking-wider opacity-70">sec</span>
        </div>
      </div>
    </div>
  );
}
