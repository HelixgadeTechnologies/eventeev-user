"use client";

import { motion } from "framer-motion";
import { Search, Mic2, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { MOCK_SPEAKERS } from "@/lib/data";

export default function SpeakersPage() {
  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-black text-eventeev-navy uppercase tracking-tighter mb-2">Speakers</h1>
        <p className="text-eventeev-slate text-sm font-medium">Learn from the industry pioneers.</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or topic..."
          className="w-full h-14 pl-14 pr-6 bg-slate-100 border-none rounded-2xl text-sm font-bold text-eventeev-navy focus:bg-white focus:ring-2 focus:ring-eventeev-orange transition-all duration-300"
        />
      </div>

      {/* Speakers List */}
      <div className="space-y-6">
        {MOCK_SPEAKERS.map((speaker, i) => (
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white p-6 rounded-[2rem] premium-shadow border border-slate-50 flex gap-6"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-500">
                <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-eventeev-orange rounded-full flex items-center justify-center border-4 border-white">
                <Mic2 className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-black text-eventeev-navy truncate">{speaker.name}</h3>
              </div>
              <p className="text-xs font-bold text-eventeev-orange uppercase tracking-widest mb-3">{speaker.role}</p>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4 line-clamp-2">
                {speaker.bio}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={speaker.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-eventeev-orange hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn
                </a>
                {speaker.resourceId && (
                  <Link
                    href={`/resources?id=${speaker.resourceId}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 rounded-xl text-[10px] font-black text-eventeev-orange uppercase tracking-widest hover:bg-eventeev-orange hover:text-white transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Resources
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
