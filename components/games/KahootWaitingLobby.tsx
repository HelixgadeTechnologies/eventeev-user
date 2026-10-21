"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, User, ArrowLeft, PlayCircle, Radio, Sparkles } from "lucide-react";

interface KahootWaitingLobbyProps {
  pin: string;
  nickname: string;
  onLeave: () => void;
  onStartDemo?: () => void;
  isSandbox?: boolean;
}

export function KahootWaitingLobby({
  pin,
  nickname,
  onLeave,
  onStartDemo,
  isSandbox = false
}: KahootWaitingLobbyProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="text-center bg-white p-6 sm:p-10 md:p-12 rounded-3xl premium-shadow border border-slate-100 max-w-lg w-full relative overflow-hidden"
      >
        {/* Ambient Top Kahoot 4-Color Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#E21B3C] via-[#1368CE] via-[#D89E00] to-[#26890C]" />

        <div className="flex justify-between items-center mb-6 sm:mb-8 pt-1">
          <button
            onClick={onLeave}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-black shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">Live Connected</span>
          </div>
        </div>

        {/* Pulse Logo with Radar Waves */}
        <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-3xl bg-orange-400/30"
          />
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-gradient-to-tr from-eventeev-orange to-amber-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/25 relative z-10"
          >
            <Zap className="w-10 h-10 fill-white text-white drop-shadow-sm" />
          </motion.div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-eventeev-navy mb-2 tracking-tight">
          You&apos;re in!
        </h2>
        <p className="text-slate-500 font-semibold text-sm sm:text-base mb-6 max-w-sm mx-auto leading-relaxed">
          See your nickname on the main stage screen? As soon as the admin launches the game, <strong className="text-eventeev-navy font-black">your controller buttons will appear here automatically!</strong>
        </p>

        {/* Player Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 bg-eventeev-navy rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-wider">Player Name</p>
              <p className="text-base sm:text-lg font-black text-eventeev-navy leading-tight">{nickname}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-wider">Game PIN</p>
            <p className="text-base sm:text-lg font-black text-eventeev-orange font-mono tracking-widest">{pin}</p>
          </div>
        </div>

        {/* Real-Time Sync Indicator */}
        <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-eventeev-orange font-black text-xs sm:text-sm">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>Listening for host start signal...</span>
        </div>

        {/* Demo trigger helper */}
        {onStartDemo && !isSandbox && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-3">Testing alone without the host display?</p>
            <button
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-eventeev-orange" />
              Simulate Game Start
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
