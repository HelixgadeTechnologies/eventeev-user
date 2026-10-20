"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, User, ArrowLeft, PlayCircle } from "lucide-react";

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
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="text-center bg-white p-8 md:p-12 rounded-3xl premium-shadow border border-slate-100 max-w-lg w-full relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-blue-500 via-yellow-500 to-green-500" />

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onLeave}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Leave
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Connected</span>
          </div>
        </div>

        {/* Pulse Logo Icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-orange-500/10 text-eventeev-orange rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/10"
        >
          <Zap className="w-10 h-10 fill-eventeev-orange" />
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-black text-eventeev-navy mb-2">
          You&apos;re in!
        </h2>
        <p className="text-slate-500 font-medium text-base mb-8 max-w-xs mx-auto">
          Look at the main screen. The game will start as soon as the host is ready!
        </p>

        {/* Player Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 bg-eventeev-navy rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-wider">Player Name</p>
              <p className="text-lg font-black text-eventeev-navy leading-tight">{nickname}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-black text-slate-400 tracking-wider">PIN</p>
            <p className="text-lg font-black text-eventeev-orange font-mono tracking-widest">{pin}</p>
          </div>
        </div>

        {/* Loading Spinner Indicator */}
        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-sm mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-eventeev-orange" />
          <span>Waiting for host to launch the first question...</span>
        </div>

        {/* Demo trigger helper */}
        {onStartDemo && !isSandbox && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-3">Testing without a live host screen?</p>
            <button
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10"
            >
              <PlayCircle className="w-4 h-4 text-eventeev-orange" />
              Simulate Live Game
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
