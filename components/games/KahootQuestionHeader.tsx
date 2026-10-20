"use client";

import { motion } from "framer-motion";
import { Timer, Flame, Trophy, X } from "lucide-react";
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
    <div className="w-full flex flex-col gap-4 mb-4 md:mb-6">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Exit Game"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <span className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Question {questionNumber} / {totalQuestions}
          </span>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-2 md:gap-3">
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs md:text-sm font-black"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{streak} Streak</span>
            </motion.div>
          )}

          <div className="flex items-center gap-1.5 bg-orange-50 text-eventeev-orange border border-orange-200 px-3 py-1.5 rounded-xl text-xs md:text-sm font-black">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* Progress & Countdown Bar */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            isUrgent ? "bg-red-500" : "bg-eventeev-orange"
          )}
          style={{ width: `${percentLeft}%` }}
          transition={{ ease: "linear", duration: 0.3 }}
        />
      </div>

      {/* Question Text Box + Timer Badge */}
      <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between gap-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-eventeev-navy leading-snug">
          {questionText}
        </h2>

        {/* Circular Countdown Timer */}
        <div
          className={cn(
            "flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all",
            isUrgent
              ? "bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/30"
              : "bg-slate-900 text-white"
          )}
        >
          <span className="text-lg md:text-xl leading-none">{timeLeft}</span>
          <span className="text-[9px] uppercase tracking-wider opacity-70">sec</span>
        </div>
      </div>
    </div>
  );
}
