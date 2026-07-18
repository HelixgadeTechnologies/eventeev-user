"use client";
import { useState, useEffect } from "react";
import { Loader2, Users, MapPin, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const storedEventId = localStorage.getItem("eventId");
        if (!storedEventId) {
          setLoading(false);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
        const response = await fetch(`${API_URL}/api/speaker/event/${storedEventId}`);
        
        if (response.ok) {
          const data = await response.json();
          // Assuming the backend returns an array or an object with the array
          const speakersList = Array.isArray(data) ? data : data.speakers || [];
          
          const normalizedSpeakers = speakersList.map((s: any) => {
            if (typeof s === "string") return { name: s, role: "Speaker", bio: "", photo: "" };
            
            const name = s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || "Unknown Speaker";
            return {
              ...s,
              name,
              role: s.title || s.role || "Speaker",
              company: s.company || "",
              photo: s.photo || s.imageUrl || ""
            };
          });
          setSpeakers(normalizedSpeakers);
        }
      } catch (error) {
        console.error("Failed to fetch speakers:", error);
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
          <Users className="w-6 h-6 text-eventeev-orange" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-eventeev-navy">Event Speakers</h1>
          <p className="text-sm font-medium text-slate-500">Discover the voices behind the sessions</p>
        </div>
      </div>

      {speakers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl premium-shadow border border-slate-100 text-center">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-eventeev-navy mb-2">No Speakers Listed</h3>
          <p className="text-slate-500 font-medium">The organizer hasn't added any speakers for this event yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-white rounded-3xl premium-shadow border border-slate-100 overflow-hidden group"
            >
              <div className="h-48 bg-slate-100 overflow-hidden">
                <img 
                  src={speaker.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=random&color=fff`} 
                  alt={speaker.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-black text-eventeev-navy mb-1 line-clamp-1">{speaker.name}</h3>
                <p className="text-sm font-bold text-eventeev-orange mb-3 line-clamp-1">
                  {speaker.role} {speaker.company ? `• ${speaker.company}` : ''}
                </p>
                {speaker.bio && (
                  <p className="text-sm font-medium text-slate-500 line-clamp-3">
                    {speaker.bio}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
