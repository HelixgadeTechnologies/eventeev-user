'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const locales = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'de', name: 'German', native: 'Deutsch' },
  ];

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  function switchLocale(nextLocale: string) {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 text-slate-700 font-medium text-sm group disabled:opacity-50"
      >
        <Globe className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
        <span>{currentLocale.native}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
            >
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Language
              </div>
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {locales.map((loc) => (
                  <button
                    key={loc.code}
                    onClick={() => switchLocale(loc.code)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                      locale === loc.code ? 'text-orange-600 bg-orange-50/50' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{loc.native}</span>
                      <span className="text-[10px] text-slate-400">{loc.name}</span>
                    </div>
                    {locale === loc.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

