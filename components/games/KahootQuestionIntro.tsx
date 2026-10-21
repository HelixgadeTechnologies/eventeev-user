"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Tv } from "lucide-react";

interface KahootQuestionIntroProps {
  questionNumber: number;
  totalQuestions: number;
  questionText?: string;
  category?: string;
  introTimeLeft: number;
}

export function KahootQuestionIntro({
  questionNumber,
  totalQuestions,
  questionText,
  category = "Live Event Trivia",
  introTimeLeft
}: KahootQuestionIntroProps) {
  // Mobile haptic vibration on count tick
  useEffect(() => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Ignore vibration errors
      }
    }
  }, [introTimeLeft]);

  const progressPercent = Math.max(0, Math.min(100, (introTimeLeft / 3) * 100));

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md bg-white p-6 sm:p-8 md:p-10 rounded-[32px] premium-shadow border border-slate-100 flex flex-col items-center relative overflow-hidden"
      >
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100">
          <motion.div
            className="h-full bg-gradient-to-r from-eventeev-orange to-amber-500"
            style={{ width: `${progressPercent}%` }}
            transition={{ ease: "linear", duration: 1 }}
          />
        </div>

        {/* Round Badge */}
        <div className="bg-orange-50 text-eventeev-orange border border-orange-200/60 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          Round {questionNumber} of {totalQuestions}
        </div>

        {/* Question Title Header */}
        <h2 className="text-3xl md:text-4xl font-black text-eventeev-navy tracking-tight mb-2 uppercase">
          Question {questionNumber}
        </h2>

        {/* Look up at screen reminder */}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-6 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
          <Tv className="w-4 h-4 text-eventeev-orange" />
          <span>Look up at the main screen!</span>
        </div>

        {/* Category Card */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Category</span>
          </div>
          <p className="text-base sm:text-lg font-black text-eventeev-navy truncate max-w-xs">
            {category}
          </p>
        </div>

        {/* Circular Countdown to Answering Phase */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Answers unlock in
          </span>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-eventeev-navy text-white flex items-center justify-center shadow-xl shadow-slate-900/10">
            <AnimatePresence mode="wait">
              <motion.span
                key={introTimeLeft}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="text-4xl sm:text-5xl font-black font-mono leading-none"
              >
                {introTimeLeft}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            seconds
          </span>
        </div>

        {questionText && (
          <p className="mt-4 text-xs font-bold text-slate-400 line-clamp-1 italic max-w-xs">
            &ldquo;{questionText}&rdquo;
          </p>
        )}
      </motion.div>
    </div>
  );
}
