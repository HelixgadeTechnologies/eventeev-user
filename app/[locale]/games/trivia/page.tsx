"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const QUESTION = {
  text: "What is the primary goal of the 'Eventeev Pocket Concierge'?",
  options: [
    "To automate event registration",
    "To maximize serendipitous human connections",
    "To reduce event security costs",
    "To replace event staff with AI"
  ],
  correct: 1
};

export default function TriviaPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === QUESTION.correct;

  return (
    <div className="flex flex-col min-h-screen bg-eventeev-navy text-white p-8">
      <header className="flex justify-between items-center mb-12 pt-4">
        <Link href="/dashboard" className="text-white/40 font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Exit
        </Link>
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/10">
          <Timer className="w-4 h-4 text-eventeev-orange" />
          <span className="text-xs font-black tracking-widest uppercase">00:45</span>
        </div>
      </header>

      <div className="flex-1">
        <div className="w-16 h-16 bg-eventeev-orange rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-orange-500/20">
          <Zap className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-black mb-12 leading-tight">
          {QUESTION.text}
        </h2>

        <div className="space-y-4">
          {QUESTION.options.map((option, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={cn(
                "w-full p-6 rounded-3xl text-left font-bold text-sm transition-all duration-300 border-2",
                selected === i 
                  ? (submitted 
                      ? (isCorrect ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500")
                      : "bg-white/10 border-eventeev-orange shadow-lg")
                  : "bg-white/5 border-transparent hover:bg-white/10"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {submitted && i === QUESTION.correct && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {submitted && selected === i && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={selected === null}
            className={cn(
              "w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl",
              selected !== null ? "bg-white text-eventeev-navy" : "bg-white/10 text-white/20 cursor-not-allowed"
            )}
          >
            Submit Answer
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={cn(
              "mb-8 p-6 rounded-3xl flex flex-col items-center gap-4",
              isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
              <Trophy className={cn("w-12 h-12", isCorrect ? "text-green-500" : "text-red-500/40")} />
              <div>
                <p className="text-xl font-black uppercase tracking-tighter">
                  {isCorrect ? "+50 Pulse Points!" : "Better luck next time!"}
                </p>
                <p className="text-xs font-medium opacity-60 mt-1 uppercase tracking-widest">
                  Daily Trivia: 12/05/2026
                </p>
              </div>
            </div>
            
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/60 font-black text-sm uppercase tracking-widest hover:text-white transition-colors"
            >
              Return to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
