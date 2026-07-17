"use client";
import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock, MapPin, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const storedEventId = localStorage.getItem("eventId");
        if (!storedEventId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/event/public/${storedEventId}`);
        const data = await response.json();
        
        const eventInfo = data.event || data;
        if (response.ok && eventInfo?.schedule) {
          setSchedule(eventInfo.schedule);
          // Auto-select first unique date if dates are provided
          const dates = Array.from(new Set(eventInfo.schedule.map((s: any) => s.date).filter(Boolean)));
          if (dates.length > 0) setActiveDay(dates[0] as string);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  // Filter schedule if days exist
  const uniqueDates = Array.from(new Set(schedule.map(s => s.date).filter(Boolean))) as string[];
  const displayedSchedule = activeDay ? schedule.filter(s => s.date === activeDay) : schedule;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-eventeev-navy">Full Agenda</h1>
          <p className="text-sm font-medium text-slate-500">Plan your event experience</p>
        </div>
      </div>

      {uniqueDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
          {uniqueDates.map(date => (
            <button
              key={date}
              onClick={() => setActiveDay(date)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all",
                activeDay === date ? "bg-eventeev-navy text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {date}
            </button>
          ))}
        </div>
      )}

      {schedule.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl premium-shadow border border-slate-100 text-center">
          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-eventeev-navy mb-2">No Schedule Yet</h3>
          <p className="text-slate-500 font-medium">The agenda is currently being finalized. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {displayedSchedule.map((item, i) => (
            <motion.div 
              key={item.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-eventeev-orange">
                <div className="w-2 h-2 bg-eventeev-orange rounded-full" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-3xl premium-shadow border border-slate-100">
                <div className="flex items-center gap-2 text-eventeev-orange font-bold text-sm mb-2">
                  <Clock className="w-4 h-4" /> {item.startTime || "TBD"} {item.endTime && `- ${item.endTime}`}
                </div>
                <h3 className="text-xl font-black text-eventeev-navy mb-2">{item.title || item.activity}</h3>
                {item.description && <p className="text-sm font-medium text-slate-500 mb-4">{item.description}</p>}
                
                <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-slate-50">
                  {item.location && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </span>
                  )}
                  {item.speakers && item.speakers.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <User className="w-3 h-3" /> {typeof item.speakers[0] === 'string' ? item.speakers[0] : item.speakers[0].name}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
