"use client";
import { useState, useEffect } from "react";
import { Loader2, Link as LinkIcon, Download, FileText, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (response.ok && eventInfo?.resources) {
          setResources(eventInfo.resources);
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
          <LinkIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-eventeev-navy">Event Resources</h1>
          <p className="text-sm font-medium text-slate-500">Downloadable materials and important links</p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl premium-shadow border border-slate-100 text-center">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-eventeev-navy mb-2">No Resources Available</h3>
          <p className="text-slate-500 font-medium">The organizer hasn't uploaded any materials yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res, i) => (
            <motion.a
              key={res.id || i}
              href={res.url || "#"}
              target={res.url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl premium-shadow border border-slate-100 flex items-start gap-4 hover:border-eventeev-orange/30 hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-shrink-0 items-center justify-center group-hover:bg-orange-50 transition-colors">
                {res.type?.toLowerCase() === "pdf" ? (
                  <FileText className="w-6 h-6 text-red-500" />
                ) : res.type?.toLowerCase() === "link" ? (
                  <ExternalLink className="w-6 h-6 text-blue-500" />
                ) : (
                  <Download className="w-6 h-6 text-eventeev-orange" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-eventeev-navy mb-1 group-hover:text-eventeev-orange transition-colors">
                  {res.title || res.name}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {res.type || "Document"} {res.size ? `• ${res.size}` : ""}
                </p>
                {res.description && (
                  <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-2">{res.description}</p>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
