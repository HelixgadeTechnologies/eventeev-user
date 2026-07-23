"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import LanguageSwitcher from '../LanguageSwitcher';
import { Bell, LogOut, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("eventId");
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-6 border-b border-white/20 lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/icons/eventeev-logo.png" alt="Eventeev Logo" width={120} height={32} className="object-contain" priority style={{ width: 'auto', height: 'auto' }} />
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-eventeev-orange transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
          </button>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-eventeev-orange" />
                  <h3 className="text-lg font-bold text-eventeev-navy">Notifications</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-eventeev-orange text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-eventeev-navy">Welcome to Eventeev!</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Explore sessions, chat with attendees, and participate in live polls.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-full mt-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

