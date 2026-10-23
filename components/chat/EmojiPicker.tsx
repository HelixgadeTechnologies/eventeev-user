"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Smile, ThumbsUp, Heart, Sparkles, Coffee, X } from "lucide-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: { char: string; name: string }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "Smileys & Emotion",
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: [
      { char: "😀", name: "grinning face smile happy" },
      { char: "😃", name: "grinning face with big eyes happy" },
      { char: "😄", name: "grinning face with smiling eyes happy" },
      { char: "😁", name: "beaming face with smiling eyes grin" },
      { char: "😆", name: "grinning squinting face laugh" },
      { char: "😅", name: "grinning face with sweat sweat smile" },
      { char: "😂", name: "face with tears of joy laugh lol" },
      { char: "🤣", name: "rolling on the floor laughing rofl" },
      { char: "😊", name: "smiling face with smiling eyes blush" },
      { char: "😇", name: "smiling face with halo angel" },
      { char: "🙂", name: "slightly smiling face" },
      { char: "😉", name: "winking face wink" },
      { char: "😌", name: "relieved face" },
      { char: "😍", name: "smiling face with heart-eyes love" },
      { char: "🥰", name: "smiling face with hearts love cute" },
      { char: "😘", name: "face blowing a kiss love kiss" },
      { char: "😋", name: "face savoring food delicious yum" },
      { char: "😛", name: "face with tongue playful" },
      { char: "😜", name: "winking face with tongue playful joke" },
      { char: "🤪", name: "zany face silly crazy" },
      { char: "🤩", name: "star-struck excited amaze" },
      { char: "😎", name: "smiling face with sunglasses cool" },
      { char: "🥳", name: "partying face celebrate party" },
      { char: "😏", name: "smirking face smug" },
      { char: "🤗", name: "smiling face with open hands hug" },
      { char: "🤔", name: "thinking face think wonder" },
      { char: "🫡", name: "saluting face respect yes" },
      { char: "🤫", name: "shushing face quiet silence" },
      { char: "🫢", name: "face with open eyes and hand over mouth gasp" },
      { char: "😴", name: "sleeping face sleep tired" },
      { char: "🤤", name: "drooling face" },
      { char: "🤯", name: "exploding head mind blown shock" },
      { char: "🥵", name: "hot face sweat" },
      { char: "🥶", name: "cold face freezing" },
      { char: "😱", name: "face screaming in fear scream wow" },
      { char: "🥺", name: "pleading face please puppy eyes" },
      { char: "🥹", name: "face holding back tears emotional happy" },
      { char: "🤠", name: "cowboy hat face" },
      { char: "😈", name: "smiling face with horns devil evil" },
      { char: "👻", name: "ghost halloween spooky" },
      { char: "💀", name: "skull dead lol" },
      { char: "🤖", name: "robot face ai bot" },
      { char: "😺", name: "grinning cat" },
      { char: "😻", name: "smiling cat with heart-eyes" },
    ],
  },
  {
    id: "gestures",
    name: "Hands & Gestures",
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    emojis: [
      { char: "👋", name: "waving hand wave hello hi bye" },
      { char: "🤚", name: "raised back of hand" },
      { char: "✋", name: "raised hand high five stop" },
      { char: "🖖", name: "vulcan salute spock" },
      { char: "👌", name: "ok hand okay perfect" },
      { char: "🤌", name: "pinched fingers italian chef" },
      { char: "🤏", name: "pinching hand tiny small" },
      { char: "✌️", name: "victory hand peace" },
      { char: "🤞", name: "crossed fingers luck hope" },
      { char: "🫰", name: "hand with index finger and thumb crossed heart" },
      { char: "🤟", name: "love-you gesture ily" },
      { char: "🤘", name: "sign of the horns rock" },
      { char: "🤙", name: "call me hand hang loose" },
      { char: "👈", name: "backhand index pointing left" },
      { char: "👉", name: "backhand index pointing right" },
      { char: "👆", name: "backhand index pointing up" },
      { char: "👇", name: "backhand index pointing down" },
      { char: "☝️", name: "index pointing up one" },
      { char: "👍", name: "thumbs up good like yes approve" },
      { char: "👎", name: "thumbs down dislike no bad" },
      { char: "✊", name: "raised fist power" },
      { char: "👊", name: "oncoming fist punch fist bump" },
      { char: "👏", name: "clapping hands clap applause cheer" },
      { char: "🙌", name: "raising hands praise hooray celebrate" },
      { char: "🫶", name: "heart hands love" },
      { char: "👐", name: "open hands" },
      { char: "🤲", name: "palms up together pray please" },
      { char: "🤝", name: "handshake deal agreement partner" },
      { char: "🙏", name: "folded hands please thank you pray namaste" },
      { char: "✍️", name: "writing hand write notes" },
      { char: "💪", name: "flexed biceps muscle strong flex power" },
    ],
  },
  {
    id: "hearts",
    name: "Hearts & Love",
    icon: <Heart className="w-3.5 h-3.5" />,
    emojis: [
      { char: "❤️", name: "red heart love favorite" },
      { char: "🧡", name: "orange heart" },
      { char: "💛", name: "yellow heart" },
      { char: "💚", name: "green heart" },
      { char: "💙", name: "blue heart" },
      { char: "💜", name: "purple heart" },
      { char: "🖤", name: "black heart" },
      { char: "🤍", name: "white heart" },
      { char: "🤎", name: "brown heart" },
      { char: "💔", name: "broken heart sad heartbreak" },
      { char: "❤️‍🔥", name: "heart on fire passion love burning" },
      { char: "❤️‍🩹", name: "mending heart heal recovery" },
      { char: "❣️", name: "heart exclamation love" },
      { char: "💕", name: "two hearts love" },
      { char: "💞", name: "revolving hearts" },
      { char: "💓", name: "beating heart" },
      { char: "💗", name: "growing heart" },
      { char: "💖", name: "sparkling heart sparkle love" },
      { char: "💘", name: "heart with arrow cupid" },
      { char: "💝", name: "heart with ribbon gift love" },
      { char: "💌", name: "love letter envelope note" },
      { char: "💋", name: "kiss mark lips kiss" },
    ],
  },
  {
    id: "celebration",
    name: "Celebration & Sparks",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    emojis: [
      { char: "🔥", name: "fire flame lit hot trend" },
      { char: "💯", name: "hundred points perfect score 100" },
      { char: "✨", name: "sparkles magic star shine clean" },
      { char: "🌟", name: "glowing star shine" },
      { char: "⭐", name: "star favorite" },
      { char: "💥", name: "collision boom bang explosion" },
      { char: "💫", name: "dizzy star" },
      { char: "🚀", name: "rocket launch speed up fast crypto moon" },
      { char: "🎉", name: "party popper tada celebrate congratulations" },
      { char: "🎊", name: "confetti ball celebrate" },
      { char: "🎈", name: "balloon party birthday" },
      { char: "🎂", name: "birthday cake celebrate" },
      { char: "🎁", name: "wrapped gift present reward" },
      { char: "🏆", name: "trophy winner award champion first" },
      { char: "🥇", name: "1st place medal gold first" },
      { char: "🎯", name: "bullseye target goal hit direct" },
      { char: "💡", name: "light bulb idea smart tip" },
      { char: "⚡", name: "high voltage lightning fast thunder electric" },
      { char: "🌈", name: "rainbow pride colorful" },
      { char: "👑", name: "crown king queen royal vip" },
    ],
  },
  {
    id: "objects",
    name: "Activities & Items",
    icon: <Coffee className="w-3.5 h-3.5" />,
    emojis: [
      { char: "☕", name: "hot beverage coffee tea drink morning" },
      { char: "🍵", name: "teacup without handle green tea" },
      { char: "🍺", name: "beer mug drink cheers" },
      { char: "🍻", name: "clinking beer mugs cheers toast celebration" },
      { char: "🥂", name: "clinking glasses toast champagne celebration" },
      { char: "🍷", name: "wine glass drink" },
      { char: "🍕", name: "pizza food slice" },
      { char: "🍔", name: "hamburger burger fast food" },
      { char: "🍟", name: "french fries fries food" },
      { char: "🍿", name: "popcorn movie watch snack" },
      { char: "🍩", name: "doughnut donut sweet" },
      { char: "💻", name: "laptop computer tech work code" },
      { char: "📱", name: "mobile phone smartphone tech" },
      { char: "📷", name: "camera photo picture snapshot" },
      { char: "📸", name: "camera with flash photo" },
      { char: "🎙️", name: "studio microphone podcast speak voice" },
      { char: "🎧", name: "headphone music audio listen" },
      { char: "🎵", name: "musical note sound tune" },
      { char: "🔔", name: "bell notification alert ring" },
      { char: "📣", name: "megaphone announce alert broadcast" },
      { char: "💬", name: "speech balloon chat talk message" },
      { char: "💭", name: "thought balloon think imagine" },
      { char: "📌", name: "pushpin pin important note" },
      { char: "📍", name: "round pushpin location map pin" },
      { char: "🏷️", name: "label tag price" },
      { char: "📦", name: "package parcel delivery box" },
    ],
  },
];

export default function EmojiPicker({ isOpen, onClose, onSelectEmoji }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Filter emojis by search
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const results: { char: string; name: string }[] = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (!seen.has(item.char) && item.name.toLowerCase().includes(q)) {
          seen.add(item.char);
          results.push(item);
        }
      }
    }
    return results;
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="absolute bottom-full mb-3 left-0 sm:left-2 z-50 w-[310px] sm:w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col backdrop-blur-md"
        style={{
          maxHeight: "380px",
        }}
      >
        {/* Header & Search */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-eventeev-navy tracking-tight flex items-center gap-1.5">
              <span>Emojis</span>
              <span className="text-[10px] font-semibold text-slate-400">• Click to insert</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emoji (e.g. fire, clap, smile)..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-eventeev-navy focus:outline-none focus:border-eventeev-orange transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (hidden during search) */}
        {!searchQuery && (
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  title={cat.name}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-orange-50 text-eventeev-orange font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                  }`}
                >
                  {cat.icon}
                  <span className="hidden sm:inline text-[11px]">{cat.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Emoji Grid Area */}
        <div className="p-2.5 overflow-y-auto max-h-[240px] flex-1 overscroll-contain">
          {filteredEmojis ? (
            filteredEmojis.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching emojis for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1.5">
                  Search Results ({filteredEmojis.length})
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {filteredEmojis.map((e, idx) => (
                    <button
                      key={`${e.char}-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(e.char);
                      }}
                      className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-slate-100 active:scale-90 transition-all select-none"
                      title={e.name}
                    >
                      {e.char}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div>
              {EMOJI_CATEGORIES.filter((c) => c.id === activeCategory).map((cat) => (
                <div key={cat.id}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1.5">
                    {cat.name}
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {cat.emojis.map((e, idx) => (
                      <button
                        key={`${e.char}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSelectEmoji(e.char);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-orange-50/70 hover:scale-110 active:scale-95 transition-all select-none"
                        title={e.name}
                      >
                        {e.char}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
