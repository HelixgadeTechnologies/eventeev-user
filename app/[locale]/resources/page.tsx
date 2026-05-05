"use client";

import { motion } from "framer-motion";
import { FileText, Download, Link as LinkIcon, Search, Filter, ArrowRight } from "lucide-react";
import { MOCK_RESOURCES } from "@/lib/data";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-black text-eventeev-navy uppercase tracking-tighter mb-2">Resource Library</h1>
        <p className="text-eventeev-slate text-sm font-medium">Access slides, guides, and materials.</p>
      </header>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search resources..."
            className="w-full h-14 pl-14 pr-6 bg-slate-100 border-none rounded-2xl text-sm font-bold text-eventeev-navy focus:bg-white focus:ring-2 focus:ring-eventeev-orange transition-all duration-300"
          />
        </div>
        <button className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
          <Filter className="w-6 h-6" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {["All", "Guides", "Presentations", "Logistics", "Media"].map((cat, i) => (
          <button 
            key={cat}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              i === 0 ? "bg-eventeev-orange text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="space-y-6">
        {MOCK_RESOURCES.map((res, i) => (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white p-6 rounded-[2rem] premium-shadow border border-slate-50 flex items-center gap-6"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              res.type === "PDF" ? "bg-red-50 text-red-500" : 
              res.type === "PPTX" ? "bg-blue-50 text-blue-500" :
              res.type === "Link" ? "bg-green-50 text-green-500" :
              "bg-orange-50 text-orange-500"
            }`}>
              {res.type === "PDF" ? <FileText className="w-8 h-8" /> : 
               res.type === "Link" ? <LinkIcon className="w-8 h-8" /> :
               <Download className="w-8 h-8" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-eventeev-navy truncate mb-1">{res.title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {res.type} • {res.size}
              </p>
            </div>

            <button className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-eventeev-orange group-hover:text-white transition-all shadow-sm">
              {res.type === "Link" ? <ArrowRight className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Featured Resource */}
      <div className="mt-12">
        <h2 className="text-xl font-black text-eventeev-navy uppercase tracking-tighter mb-6">Must Read</h2>
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="p-8 bg-eventeev-navy rounded-[3rem] text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <span className="bg-eventeev-orange text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Essential</span>
            <h3 className="text-2xl font-black mb-3">Event Handbook 2026</h3>
            <p className="text-white/60 text-sm font-medium mb-6 leading-relaxed">
              Complete guide to the summit, networking sessions, and local logistics.
            </p>
            <button className="bg-white text-eventeev-navy px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2">
              Download PDF <Download className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
