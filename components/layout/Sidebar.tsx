"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from '@/i18n/routing';
import { Home, Users, MessageSquare, Mic2, FileText, Bell, LogOut, Calendar, Gamepad2, BarChart2, Globe, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
  { label: "Speakers", icon: Mic2, href: "/dashboard/speakers" },
  { label: "Networking", icon: Globe, href: "/dashboard/networking" },
  { label: "Chat", icon: MessageSquare, href: "/dashboard/chat" },
  { label: "Games", icon: Gamepad2, href: "/dashboard/games" },
  { label: "Polls", icon: BarChart2, href: "/dashboard/polls" },
  { label: "Resources", icon: FileText, href: "/dashboard/resources" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/attendee/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("eventId");
    router.push("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 left-0 p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Image src="/icons/eventeev-logo.png" alt="Eventeev Logo" width={140} height={40} className="object-contain" priority style={{ width: 'auto', height: 'auto' }} />
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname.endsWith("/dashboard") 
            : pathname.includes(item.href);
            
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
        
        <button 
          onClick={() => setShowNotifications(true)}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
          </div>
          <span className="font-bold">Notifications</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Log out</span>
        </button>

        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-medium mb-2">Logged in as</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Loading..."}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </div>

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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative text-left"
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
    </aside>
  );
}
