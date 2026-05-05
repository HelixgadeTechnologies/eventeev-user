export interface EventData {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  banner: string;
  schedule: Array<{ time: string; activity: string }>;
}

export const MOCK_EVENT: EventData = {
  id: "evt_1",
  code: "EVT2026",
  title: "Global Tech Summit 2026",
  subtitle: "The Serendipity Engine for Innovators",
  date: "May 12-14, 2026",
  location: "Convention Center, London",
  banner: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=2070",
  schedule: [
    { time: "09:00 AM", activity: "Opening Keynote" },
    { time: "11:00 AM", activity: "Breakout: AI in B2B" },
    { time: "01:00 PM", activity: "Networking Lunch" },
    { time: "03:00 PM", activity: "Product Launch: Eventeev v5" },
  ],
};

export const MOCK_SPEAKERS = [
  {
    id: "spk_1",
    name: "Sarah Chen",
    role: "CTO, FutureScale",
    bio: "Pioneer in distributed systems and real-time networking.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    linkedin: "https://linkedin.com/in/sarahchen",
    resourceId: "res_2",
  },
  {
    id: "spk_2",
    name: "Marcus Thorne",
    role: "VP Experience, Eventeev",
    bio: "Designing the future of human interaction at events.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    linkedin: "https://linkedin.com/in/marcusthorne",
  },
];

export const MOCK_ATTENDEES = [
  { id: "att_1", name: "Alex Rivera", bio: "Angel Investor interested in CleanTech.", photo: "https://i.pravatar.cc/150?u=att_1" },
  { id: "att_2", name: "Elena Kovic", bio: "SaaS Founder looking for partners.", photo: "https://i.pravatar.cc/150?u=att_2" },
  { id: "att_3", name: "David Wu", bio: "Full-stack dev at TechGiant.", photo: "https://i.pravatar.cc/150?u=att_3" },
];

export const MOCK_RESOURCES = [
  { id: "res_1", title: "Event Strategy Guide 2026", type: "PDF", size: "2.4 MB", url: "#" },
  { id: "res_2", title: "Speaker Slide Deck: Future of AI", type: "PPTX", size: "15.0 MB", url: "#" },
  { id: "res_3", title: "Attendee Networking Tips", type: "Link", size: "External", url: "#" },
  { id: "res_4", title: "Floor Map & Logistics", type: "Image", size: "1.2 MB", url: "#" },
];
