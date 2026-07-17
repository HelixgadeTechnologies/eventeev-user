"use client";
import { useState, useEffect } from "react";
import { Loader2, Globe, UserPlus, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NetworkingPage() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "connections">("discover");
  const [loading, setLoading] = useState(true);

  const fetchNetworkingData = async () => {
    try {
      const eventId = localStorage.getItem("eventId");
      const token = localStorage.getItem("token");
      if (!eventId || !token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      
      // Fetch attendees
      const attRes = await fetch(`${API_URL}/api/networking/attendees/${eventId}`, {
        headers: { "x-auth-token": token }
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendees(attData.attendees || []);
      }

      // Fetch connections
      const connRes = await fetch(`${API_URL}/api/networking/connections/${eventId}`, {
        headers: { "x-auth-token": token }
      });
      if (connRes.ok) {
        const connData = await connRes.json();
        setConnections(connData.connections || []);
      }

    } catch (err) {
      console.error("Networking error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkingData();
  }, []);

  const handleConnect = async (recipientId: string) => {
    try {
      const token = localStorage.getItem("token");
      const eventId = localStorage.getItem("eventId");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      
      await fetch(`${API_URL}/api/networking/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || ""
        },
        body: JSON.stringify({ recipientId, eventId })
      });
      fetchNetworkingData(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (connectionId: string, status: "accepted" | "rejected") => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      
      await fetch(`${API_URL}/api/networking/connect/${connectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || ""
        },
        body: JSON.stringify({ status })
      });
      fetchNetworkingData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-eventeev-navy">Networking</h1>
            <p className="text-sm font-medium text-slate-500">Connect with other attendees</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("discover")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === "discover" ? "bg-white text-eventeev-navy shadow-sm" : "text-slate-500 hover:text-eventeev-navy"
          )}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab("connections")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === "connections" ? "bg-white text-eventeev-navy shadow-sm" : "text-slate-500 hover:text-eventeev-navy"
          )}
        >
          My Connections ({connections.length})
        </button>
      </div>

      {activeTab === "discover" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendees.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 font-medium">No attendees found.</div>
          ) : (
            attendees.map(attendee => (
              <div key={attendee._id} className="bg-white p-6 rounded-3xl premium-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full mb-4 overflow-hidden">
                  {attendee.avatarUrl ? (
                    <img src={attendee.avatarUrl} alt={attendee.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-400">
                      {attendee.name?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-black text-eventeev-navy">{attendee.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{attendee.company || "Attendee"}</p>
                <button
                  onClick={() => handleConnect(attendee._id)}
                  className="w-full py-3 bg-slate-50 hover:bg-eventeev-orange hover:text-white text-eventeev-navy font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Connect
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "connections" && (
        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">You have no connections yet.</div>
          ) : (
            connections.map(conn => {
              // Note: Adjust logic depending on whether user is requester or recipient
              const isPending = conn.status === "pending";
              const isAccepted = conn.status === "accepted";
              
              // Assume API populates recipient/requester based on current user
              const otherUser = conn.requester?._id ? conn.requester : conn.recipient; 
              if (!otherUser) return null;

              return (
                <div key={conn._id} className="bg-white p-4 md:p-6 rounded-3xl premium-shadow border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                      {otherUser.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-slate-400">
                          {otherUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-eventeev-navy">{otherUser.name}</h3>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        isAccepted ? "text-green-500" : "text-amber-500"
                      )}>
                        {conn.status}
                      </span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(conn._id, "accepted")}
                        className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(conn._id, "rejected")}
                        className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
