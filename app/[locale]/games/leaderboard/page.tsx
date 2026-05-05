"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, ArrowUp, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const LEADERS = [
  { name: "Sarah Chen", points: 1250, rank: 1, photo: "https://i.pravatar.cc/150?u=1" },
  { name: "Marcus Thorne", points: 1100, rank: 2, photo: "https://i.pravatar.cc/150?u=2" },
  { name: "Elena Kovic", points: 950, rank: 3, photo: "https://i.pravatar.cc/150?u=3" },
  { name: "Alex Rivera", points: 800, rank: 4, photo: "https://i.pravatar.cc/150?u=4" },
  { name: "David Wu", points: 750, rank: 5, photo: "https://i.pravatar.cc/150?u=5" },
];

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-6">
      <header className="mb-12 pt-6">
        <h1 className="text-3xl font-black text-eventeev-navy uppercase tracking-tighter mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-eventeev-orange" />
          Pulse Leaders
        </h1>
        <p className="text-eventeev-slate text-sm font-medium">The most engaged innovators of the summit.</p>
      </header>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 mb-12 px-2">
        {/* 2nd Place */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden">
              <img src={LEADERS[1].photo} alt="" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-black text-white">2</div>
          </div>
          <div className="w-20 h-24 bg-white rounded-t-2xl shadow-lg border-t-4 border-slate-200 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-slate-400">950 pts</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center gap-3">
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full border-4 border-eventeev-orange overflow-hidden shadow-2xl shadow-orange-200">
              <img src={LEADERS[0].photo} alt="" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-eventeev-orange rounded-full flex items-center justify-center text-xs font-black text-white border-4 border-white">
              <Trophy className="w-4 h-4" />
            </div>
          </motion.div>
          <div className="w-24 h-32 bg-white rounded-t-2xl shadow-2xl border-t-4 border-eventeev-orange flex flex-col items-center justify-center">
            <span className="text-xs font-black text-eventeev-orange">1,250 pts</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 overflow-hidden">
              <img src={LEADERS[2].photo} alt="" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-[10px] font-black text-white">3</div>
          </div>
          <div className="w-20 h-20 bg-white rounded-t-2xl shadow-lg border-t-4 border-orange-100 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-slate-400">800 pts</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {LEADERS.slice(3).map((leader, i) => (
          <div key={leader.name} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-white shadow-sm">
            <div className="flex items-center gap-4">
              <span className="w-6 text-sm font-black text-slate-300">#{leader.rank}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                <img src={leader.photo} alt="" />
              </div>
              <div>
                <p className="text-sm font-black text-eventeev-navy">{leader.name}</p>
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-2 h-2 text-green-500" />
                  <span className="text-[8px] font-black text-green-500 uppercase">Up 2 ranks</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-eventeev-navy">{leader.points}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pulse Points</p>
            </div>
          </div>
        ))}
      </div>

      {/* Your Rank Stick Footer */}
      <div className="fixed bottom-24 left-6 right-6 glass p-5 rounded-3xl border border-white/40 flex items-center justify-between z-40 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-eventeev-navy flex items-center justify-center text-white">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-eventeev-navy">You (Ayaosigodfrey)</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rank #124 • 450 pts</p>
          </div>
        </div>
        <Link href="/games/trivia" className="bg-eventeev-orange text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200">
          Boost Rank
        </Link>
      </div>
    </div>
  );
}
