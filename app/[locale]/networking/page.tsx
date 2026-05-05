"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MessageCircle, Info, Star } from "lucide-react";
import { MOCK_ATTENDEES } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function NetworkingPage() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = (liked: boolean) => {
    setDirection(liked ? 1 : -1);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % MOCK_ATTENDEES.length);
      setDirection(0);
    }, 200);
  };

  const currentAttendee = MOCK_ATTENDEES[index];

  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-black text-eventeev-navy uppercase tracking-tighter mb-1">Serendipity Hub</h1>
        <p className="text-eventeev-slate text-sm font-medium">Discover meaningful connections.</p>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ scale: 0.9, opacity: 0, x: direction * 100 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.9, opacity: 0, x: direction * -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm aspect-[3/4] bg-white rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-slate-100"
          >
            <div className="flex-1 relative">
              <img
                src={currentAttendee.photo}
                alt={currentAttendee.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-eventeev-navy via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-eventeev-orange fill-eventeev-orange" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                    Recommended Match
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white mb-1">{currentAttendee.name}</h2>
                <p className="text-white/70 text-sm font-medium leading-relaxed">
                  {currentAttendee.bio}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tinder Controls */}
        <div className="mt-12 flex items-center justify-center gap-8 w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNext(false)}
            className="w-16 h-16 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-8 h-8" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-300"
          >
            <Info className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNext(true)}
            className="w-16 h-16 bg-eventeev-orange rounded-full shadow-xl shadow-orange-200 flex items-center justify-center text-white"
          >
            <Heart className="w-8 h-8 fill-white" />
          </motion.button>
        </div>
      </div>

      <div className="mt-8">
        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-dashed border-slate-200">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-black text-white">
              +12
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Express interest to connect</p>
        </div>
      </div>
    </div>
  );
}
