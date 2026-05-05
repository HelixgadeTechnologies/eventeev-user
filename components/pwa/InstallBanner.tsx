"use client";

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";

export function InstallBanner() {
  const { isInstallable, installPWA } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      // Check if user has already dismissed it this session
      const isDismissed = sessionStorage.getItem("pwa-banner-dismissed");
      if (!isDismissed) {
        setShowBanner(true);
      }
    }
  }, [isInstallable]);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleInstall = () => {
    installPWA();
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-80"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-200">
              <Download className="text-white w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-bold text-eventeev-navy">Install Eventeev</h4>
              <p className="text-xs text-slate-500">Get the full experience on your home screen.</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
