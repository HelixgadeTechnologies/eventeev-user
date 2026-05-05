"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Bell, Trophy, Zap, ArrowRight, FileText, Download, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { MOCK_EVENT, MOCK_RESOURCES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const c = useTranslations('Common');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-72 w-full overflow-hidden rounded-b-[3rem] shadow-2xl">
        <img
          src={MOCK_EVENT.banner}
          alt={MOCK_EVENT.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-eventeev-navy/90 via-eventeev-navy/40 to-transparent" />
        
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">{c('liveNow')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-white">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-8 right-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-white leading-tight mb-2"
          >
            {MOCK_EVENT.title}
          </motion.h1>
          <p className="text-white/80 text-sm font-medium flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-eventeev-orange" /> {MOCK_EVENT.date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-eventeev-orange" /> {MOCK_EVENT.location}</span>
          </p>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Engagement Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5 text-eventeev-orange" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('yourRank')}</p>
            <p className="text-2xl font-black text-eventeev-navy">#12</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 bg-eventeev-navy rounded-3xl shadow-xl"
          >
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-eventeev-orange" />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{t('pulseScore')}</p>
            <p className="text-2xl font-black text-white">450</p>
          </motion.div>
        </div>

        {/* Schedule Preview */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('currentSchedule')}</h2>
            <button className="text-eventeev-orange font-bold text-xs uppercase tracking-widest flex items-center gap-1">
              {t('fullAgenda')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {MOCK_EVENT.schedule.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-5 rounded-3xl flex items-center gap-6 border transition-all duration-300",
                  i === 0 ? "bg-white border-eventeev-orange shadow-lg" : "bg-slate-50 border-transparent"
                )}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{item.time.split(" ")[1]}</span>
                  <span className="text-lg font-black text-eventeev-navy leading-none">{item.time.split(" ")[0]}</span>
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-bold", i === 0 ? "text-eventeev-orange" : "text-eventeev-navy")}>
                    {item.activity}
                  </p>
                  {i === 0 && <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">{t('happeningNow')}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Daily Trivia Callout */}
        <Link 
          href="/games/trivia"
          className="block p-6 bg-gradient-to-br from-eventeev-orange to-orange-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Zap className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2">{t('triviaCalloutTitle')}</h3>
            <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed">
              {t('triviaCalloutDescription')}
            </p>
            <div className="inline-block bg-white text-eventeev-orange px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">
              {t('startTrivia')}
            </div>
          </div>
        </Link>

        {/* Games Hub Section */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('gamesHub')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/games/trivia" className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100 group">
              <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-eventeev-orange group-hover:text-white transition-colors">
                <Zap className="w-5 h-5 text-eventeev-orange group-hover:text-white" />
              </div>
              <p className="text-sm font-black text-eventeev-navy">{t('dailyTrivia')}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t('winPoints')}</p>
            </Link>
            <Link href="/games/leaderboard" className="p-5 bg-white rounded-3xl premium-shadow border border-slate-100 group">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Trophy className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-black text-eventeev-navy">{t('leaderboard')}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t('viewRankings')}</p>
            </Link>
          </div>
        </div>

        {/* Resources Section */}
        <div className="pb-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter">{t('eventResources')}</h2>
            <button className="text-eventeev-orange font-bold text-xs uppercase tracking-widest flex items-center gap-1">
              {t('viewAll')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {MOCK_RESOURCES.map((res, i) => (
              <motion.div 
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white rounded-3xl border border-slate-100 premium-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                    {res.type === "PDF" ? <FileText className="w-5 h-5 text-red-500" /> : 
                     res.type === "Link" ? <LinkIcon className="w-5 h-5 text-blue-500" /> :
                     <Download className="w-5 h-5 text-eventeev-orange" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-eventeev-navy">{res.title}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{res.type} • {res.size}</p>
                  </div>
                </div>
                <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-eventeev-orange transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

