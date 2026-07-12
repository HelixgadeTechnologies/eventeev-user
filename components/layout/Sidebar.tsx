"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from '@/i18n/routing';
import { Home, Users, MessageSquare, Mic2, FileText, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '../LanguageSwitcher';

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Network", icon: Users, href: "/networking" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Speakers", icon: Mic2, href: "/speakers" },
  { label: "Resources", icon: FileText, href: "/resources" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 left-0 p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
          <span className="text-white font-black text-2xl">E</span>
        </div>
        <span className="font-black text-2xl text-slate-900 tracking-tighter uppercase">Eventeev</span>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-bold text-slate-900">Language</span>
          <LanguageSwitcher />
        </div>
        
        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
          <div className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
          </div>
          <span className="font-bold">Notifications</span>
        </button>

        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-medium mb-2">Logged in as</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">John Doe</p>
              <p className="text-[10px] text-slate-400 truncate">john@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
