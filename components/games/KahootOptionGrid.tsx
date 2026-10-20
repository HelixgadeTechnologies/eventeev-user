"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KahootOptionGridProps {
  options: string[];
  selectedOptionIndex: number | null;
  onSelectOption: (index: number) => void;
  disabled?: boolean;
}

export const KAHOOT_THEME = [
  {
    name: "triangle",
    label: "A",
    color: "#E21B3C",
    bgClass: "bg-[#E21B3C]",
    borderClass: "border-[#C01431]",
    shadowClass: "shadow-[#E21B3C]/30",
    shape: (
      <svg className="w-8 h-8 md:w-10 md:h-10 fill-white" viewBox="0 0 24 24">
        <polygon points="12,3 22,21 2,21" />
      </svg>
    )
  },
  {
    name: "diamond",
    label: "B",
    color: "#1368CE",
    bgClass: "bg-[#1368CE]",
    borderClass: "border-[#0E52A7]",
    shadowClass: "shadow-[#1368CE]/30",
    shape: (
      <svg className="w-8 h-8 md:w-10 md:h-10 fill-white" viewBox="0 0 24 24">
        <polygon points="12,2 22,12 12,22 2,12" />
      </svg>
    )
  },
  {
    name: "circle",
    label: "C",
    color: "#D89E00",
    bgClass: "bg-[#D89E00]",
    borderClass: "border-[#B58400]",
    shadowClass: "shadow-[#D89E00]/30",
    shape: (
      <svg className="w-8 h-8 md:w-10 md:h-10 fill-white" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" />
      </svg>
    )
  },
  {
    name: "square",
    label: "D",
    color: "#26890C",
    bgClass: "bg-[#26890C]",
    borderClass: "border-[#1E6E09]",
    shadowClass: "shadow-[#26890C]/30",
    shape: (
      <svg className="w-8 h-8 md:w-10 md:h-10 fill-white" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    )
  }
];

export function KahootOptionGrid({
  options,
  selectedOptionIndex,
  onSelectOption,
  disabled = false
}: KahootOptionGridProps) {
  // Support 2 to 4 options
  const displayOptions = options.length > 0 ? options : ["Option 1", "Option 2", "Option 3", "Option 4"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 w-full flex-1 min-h-[300px] md:min-h-[420px]">
      {displayOptions.slice(0, 4).map((optionText, idx) => {
        const theme = KAHOOT_THEME[idx] || KAHOOT_THEME[0];
        const isSelected = selectedOptionIndex === idx;
        const isOtherSelected = selectedOptionIndex !== null && selectedOptionIndex !== idx;

        return (
          <motion.button
            key={idx}
            type="button"
            disabled={disabled || selectedOptionIndex !== null}
            whileHover={!disabled && selectedOptionIndex === null ? { scale: 1.015, y: -2 } : {}}
            whileTap={!disabled && selectedOptionIndex === null ? { scale: 0.96 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => onSelectOption(idx)}
            className={cn(
              "relative group flex flex-col justify-between p-5 md:p-7 rounded-2xl md:rounded-3xl text-left transition-all duration-200 select-none shadow-lg cursor-pointer overflow-hidden border-b-4",
              theme.bgClass,
              theme.borderClass,
              theme.shadowClass,
              isSelected && "ring-4 ring-white ring-offset-4 ring-offset-slate-900 scale-[1.02] shadow-2xl z-10",
              isOtherSelected && "opacity-35 scale-[0.98] grayscale-[30%]",
              disabled && selectedOptionIndex === null && "opacity-60 cursor-not-allowed"
            )}
          >
            {/* Top row: Shape Symbol & Letter Badge */}
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-1 rounded-xl bg-black/15 backdrop-blur-sm flex items-center justify-center">
                {theme.shape}
              </div>
              <span className="text-white/80 font-black text-sm md:text-base tracking-widest bg-black/20 px-3 py-1 rounded-full uppercase">
                {theme.label}
              </span>
            </div>

            {/* Bottom/Center: Option text */}
            <div className="flex-1 flex items-center">
              <p className="text-white font-extrabold text-base md:text-xl lg:text-2xl leading-snug break-words drop-shadow-sm">
                {optionText}
              </p>
            </div>

            {/* Selection highlight overlay */}
            {isSelected && (
              <motion.div
                layoutId="selection-glow"
                className="absolute inset-0 bg-white/20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
