'use client';

import React from 'react';
import LanguageSwitcher from '../LanguageSwitcher';
import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-6 border-b border-white/20 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xl">E</span>
        </div>
        <span className="font-black text-eventeev-navy tracking-tighter uppercase">Eventeev</span>
      </div>
      
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-eventeev-orange transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}

