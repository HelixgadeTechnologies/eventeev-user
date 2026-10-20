"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Flame, Trophy, Award } from "lucide-react";
import { KAHOOT_THEME } from "./KahootOptionGrid";
import { cn } from "@/lib/utils";

interface KahootResultOverlayProps {
  isCorrect: boolean;
  pointsAdded: number;
  totalScore: number;
  streak: number;
  correctOptionIndex: number;
  correctOptionText?: string;
  rank?: number;
}

export function KahootResultOverlay({
  isCorrect,
  pointsAdded,
  totalScore,
  streak,
  correctOptionIndex,
  correctOptionText,
  rank
}: KahootResultOverlayProps) {
  const correctTheme = KAHOOT_THEME[correctOptionIndex] || KAHOOT_THEME[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="flex-1 flex flex-col items-center justify-center p-4 text-center"
    >
      <div
        className={cn(
          "w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl border text-white flex flex-col items-center relative overflow-hidden",
          isCorrect
            ? "bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-500 shadow-emerald-900/30"
            : "bg-gradient-to-b from-red-600 to-red-700 border-red-500 shadow-red-900/30"
        )}
      >
        {/* Result Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl"
        >
          {isCorrect ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <XCircle className="w-12 h-12 text-white" />
          )}
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          {isCorrect ? "Correct!" : "Incorrect"}
        </h2>

        {/* Points added */}
        {isCorrect ? (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-white/20 px-5 py-2 rounded-2xl mb-6 backdrop-blur-sm"
          >
            <Trophy className="w-5 h-5 text-amber-300" />
            <span className="text-xl font-black tracking-wide">+{pointsAdded} pts</span>
          </motion.div>
        ) : (
          <p className="text-white/80 font-bold text-sm mb-6 max-w-xs">
            Keep your momentum going for the next question!
          </p>
        )}

        {/* Correct Answer hint if incorrect */}
        {!isCorrect && (
          <div className="w-full bg-black/20 rounded-2xl p-4 mb-6 border border-white/10 flex items-center gap-3 text-left">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", correctTheme.bgClass)}>
              {correctTheme.shape}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Correct Answer</p>
              <p className="text-sm font-bold truncate text-white">
                {correctOptionText || `Option ${correctTheme.label}`}
              </p>
            </div>
          </div>
        )}

        {/* Streak & Rank Stats Card */}
        <div className="w-full grid grid-cols-2 gap-3 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex flex-col items-center justify-center border-r border-white/10 pr-2">
            <div className="flex items-center gap-1 text-white/70 text-xs font-black uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Streak</span>
            </div>
            <p className="text-xl font-black">{streak}</p>
          </div>

          <div className="flex flex-col items-center justify-center pl-2">
            <div className="flex items-center gap-1 text-white/70 text-xs font-black uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Total Score</span>
            </div>
            <p className="text-xl font-black">{totalScore.toLocaleString()}</p>
          </div>
        </div>

        {rank && (
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/80">
            Current Rank: #{rank}
          </p>
        )}
      </div>
    </motion.div>
  );
}
