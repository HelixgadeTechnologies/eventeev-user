"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface KahootPodiumProps {
  finalScore: number;
  finalRank: number;
  totalParticipants: number;
  topLeaderboard?: Array<{ name: string; score: number; rank: number }>;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function KahootPodium({
  finalScore,
  finalRank,
  totalParticipants,
  topLeaderboard = [],
  onPlayAgain,
  onExit
}: KahootPodiumProps) {
  const isPodium = finalRank <= 3;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl premium-shadow border border-slate-100 text-center relative overflow-hidden"
      >
        {/* Confetti ambient ribbon */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-eventeev-orange via-amber-400 to-eventeev-navy" />

        {/* Big Trophy */}
        <motion.div
          animate={{ rotate: [-3, 3, -3], y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-300/50"
        >
          <Trophy className="w-12 h-12 text-amber-900" />
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-black text-eventeev-navy mb-1">
          {isPodium ? "Podium Finish!" : "Quiz Completed!"}
        </h2>
        <p className="text-slate-500 font-bold text-sm mb-6">
          You placed <span className="text-eventeev-orange font-black">#{finalRank}</span> out of {totalParticipants} players!
        </p>

        {/* Pulse Score Highlight */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-8 flex items-center justify-around">
          <div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Final Rank</p>
            <p className="text-3xl font-black text-eventeev-navy">#{finalRank}</p>
          </div>
          <div className="w-[1px] h-10 bg-slate-200" />
          <div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Pulse Points</p>
            <p className="text-3xl font-black text-eventeev-orange">{finalScore.toLocaleString()}</p>
          </div>
        </div>

        {/* Top 3 Leaderboard if available */}
        {topLeaderboard.length > 0 && (
          <div className="mb-8 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">
              Top Players
            </h4>
            <div className="space-y-2">
              {topLeaderboard.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold",
                    idx === 0
                      ? "bg-amber-500/10 border-amber-300 text-amber-900"
                      : "bg-slate-50 border-slate-100 text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-xs">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-black text-eventeev-navy">{item.score.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPlayAgain}
            className="h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={onExit}
            className="h-14 bg-eventeev-navy hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 text-sm"
          >
            Exit Game
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
