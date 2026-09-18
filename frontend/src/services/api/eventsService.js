import { apiRequest } from "./http";
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/constants";
import { getAuthHeaders } from "../../lib/supabaseClient";

const STORAGE_KEY = "unionhub-events";

const INITIAL_EVENTS = [
  {
    id: "evt-001",
    title: "Annual Tech Symposium",
    description: "Meet industry leaders, witness student project showcases, and explore cutting-edge engineering workshops across AI and robotics.",
    date: "2026-09-15",
    time: "10:00 AM",
    venue: "Auditorium A",
    category: "symposium",
    attendees: 245,
    registered: false,
    image: "/images/events/tech-symposium.jpg",
    speakers: ["Dr. Aris Thorne (DeepMind)", "Ananya Sen (Lead Architect, CloudScale)"],
    agenda: [
      "10:00 AM — Inaugural Address",
      "11:15 AM — Keynote: Future of Autonomous Systems",
      "01:30 PM — Student Project Demonstrations",
      "03:45 PM — Awards & Networking Session"
    ],
  },
  {
    id: "evt-002",
    title: "Football Championship",
    description: "Annual inter-department football cup featuring 16 departmental teams competing for the coveted Union Trophy.",
    date: "2026-09-10",
    time: "4:00 PM",
    venue: "Sports Ground",
    category: "sports",
    attendees: 180,
    registered: true,
    image: "/images/events/football.jpg",
    speakers: ["Coach Rahul Nair", "Sports Secretary"],
    agenda: [
      "04:00 PM — Opening Match: CSE vs ME",
      "05:15 PM — Quarter-Final 1: ECE vs CE",
      "06:30 PM — Match Highlights & Scoreboard Update"
    ],
  },
  {
    id: "evt-003",
    title: "Photography Workshop",
    description: "Master manual camera controls, lighting setups, compositional framing, and post-processing fundamentals.",
    date: "2026-09-20",
    time: "2:00 PM",
    venue: "Studio Lab",
    category: "workshop",
    attendees: 62,
    registered: false,
    image: "/images/events/photography.jpg",
    speakers: ["Vivek Menon (National Geographic Contributor)"],
    agenda: [
      "02:00 PM — Camera Optics & Sensor Fundamentals",
      "03:00 PM — Outdoor Campus Photo Walk",
      "04:30 PM — Lightroom Color Grading Live Session"
    ],
  },
  {
    id: "evt-004",
    title: "Freshers' Welcome Party",
    description: "The grand welcome social evening for our incoming batch! Music, games, cultural performances, and refreshments.",
    date: "2026-09-05",
    time: "6:00 PM",
    venue: "Main Hall",
    category: "social",
    attendees: 512,
    registered: true,
    image: "/images/events/freshers.jpg",
    speakers: ["College Union President", "Cultural Secretary"],
    agenda: [
      "06:00 PM — Welcome & Icebreaker Games",
      "07:15 PM — Departmental Music & Dance Performances",
      "08:30 PM — DJ Night & Refreshments"
    ],
  },
];

function getStoredEvents() {
  if (typeof window === "undefined") return INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVENTS;
  } catch {
    return INITIAL_EVENTS;
  }
}

function saveStoredEvents(events) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to save events in localStorage", e);
  }
}

export const eventsService = {
  async getEvents(filters = {}) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const params = new URLSearchParams({
        select: "*",
        status: "eq.published",
        order: "start_at.asc",
      });
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/events?${params}`, { headers: await getAuthHeaders() });
        if (!response.ok) throw new Error(`Supabase events request failed: ${response.status}`);
        const rows = await response.json();
        return {
          ok: true,
          data: rows.map((event) => ({
            ...event,
            date: event.start_at?.split("T")[0] || "",
            time: event.start_at ? new Date(event.start_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
            image: event.poster_url || "",
            attendees: event.attendees || 0,
            registered: false,
          })),
        };
      } catch (error) {
        console.warn("Could not load published events from Supabase:", error.message);
        return { ok: true, data: [] };
      }
    }
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const filtered = allEvents.filter((evt) => {
        if (filters.category && filters.category !== "all" && evt.category !== filters.category) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchTitle = evt.title?.toLowerCase().includes(q);
          const matchVenue = evt.venue?.toLowerCase().includes(q);
          const matchDesc = evt.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchVenue && !matchDesc) return false;
        }
        return true;
      });
      return { ok: true, data: filtered };
    }

    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/events?${params}`, { method: "GET" });
  },

  async getEventDetails(eventId) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}&select=*`, { headers: await getAuthHeaders() });
        if (!response.ok) throw new Error(`Supabase event request failed: ${response.status}`);
        const rows = await response.json();
        const event = rows[0];
        return event
          ? { ok: true, data: { ...event, date: event.start_at?.split("T")[0] || "", time: event.start_at ? new Date(event.start_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "", image: event.poster_url || "", speakers: [], agenda: [] } }
          : { ok: false, status: 404, data: { error: "Event not found" } };
      } catch (error) {
        return { ok: false, status: 500, data: { error: error.message } };
      }
    }
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const event = allEvents.find((e) => e.id === eventId);
      return event
        ? {
            ok: true,
            data: {
              ...event,
              speakers: Array.isArray(event.speakers) ? event.speakers : [],
              agenda: Array.isArray(event.agenda) ? event.agenda : [],
            },
          }
        : { ok: false, status: 404, data: { error: "Event not found" } };
    }
    return apiRequest(`/api/events/${eventId}`, { method: "GET" });
  },

  async createEvent(eventData) {
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const newEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        title: eventData.title,
        description: eventData.description || "",
        date: eventData.date,
        time: eventData.time || "10:00 AM",
        venue: eventData.venue || "Campus Auditorium",
        category: eventData.category || "symposium",
        attendees: 0,
        registered: false,
        image: eventData.image?.trim() ? eventData.image.trim() : "",
        speakers: Array.isArray(eventData.speakers)
          ? eventData.speakers
          : typeof eventData.speakers === "string" && eventData.speakers.trim()
          ? eventData.speakers.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        agenda: Array.isArray(eventData.agenda)
          ? eventData.agenda
          : typeof eventData.agenda === "string" && eventData.agenda.trim()
          ? eventData.agenda.split("\n").map((a) => a.trim()).filter(Boolean)
          : [],
      };

      const updated = [newEvent, ...allEvents];
      saveStoredEvents(updated);

      return { ok: true, data: newEvent };
    }

    return apiRequest("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(eventId) {
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const updated = allEvents.filter((e) => e.id !== eventId);
      saveStoredEvents(updated);
      return { ok: true, data: { id: eventId, deleted: true } };
    }

    return apiRequest(`/api/events/${eventId}`, { method: "DELETE" });
  },

  async updateEvent(eventId, eventData) {
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const targetIndex = allEvents.findIndex((e) => e.id === eventId);
      if (targetIndex === -1) {
        return { ok: false, status: 404, data: { error: "Event not found" } };
      }

      const existing = allEvents[targetIndex];
      const updatedEvent = {
        ...existing,
        title: eventData.title ?? existing.title,
        description: eventData.description ?? existing.description,
        date: eventData.date ?? existing.date,
        time: eventData.time ?? existing.time,
        venue: eventData.venue ?? existing.venue,
        category: eventData.category ?? existing.category,
        image: typeof eventData.image === "string" ? eventData.image.trim() : existing.image,
        speakers: Array.isArray(eventData.speakers)
          ? eventData.speakers
          : typeof eventData.speakers === "string"
          ? eventData.speakers.split(",").map((s) => s.trim()).filter(Boolean)
          : existing.speakers || [],
        agenda: Array.isArray(eventData.agenda)
          ? eventData.agenda
          : typeof eventData.agenda === "string"
          ? eventData.agenda.split("\n").map((a) => a.trim()).filter(Boolean)
          : existing.agenda || [],
      };

      const updated = [...allEvents];
      updated[targetIndex] = updatedEvent;
      saveStoredEvents(updated);

      return { ok: true, data: updatedEvent };
    }

    return apiRequest(`/api/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  },

  async registerForEvent(eventId) {
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const updated = allEvents.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            registered: true,
            attendees: (e.attendees || 0) + 1,
          };
        }
        return e;
      });
      saveStoredEvents(updated);
      return {
        ok: true,
        data: { registered: true, eventId, timestamp: new Date().toISOString() },
      };
    }

    return apiRequest(`/api/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async unregisterFromEvent(eventId) {
    if (DEMO_MODE) {
      const allEvents = getStoredEvents();
      const updated = allEvents.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            registered: false,
            attendees: Math.max(0, (e.attendees || 1) - 1),
          };
        }
        return e;
      });
      saveStoredEvents(updated);
      return {
        ok: true,
        data: { unregistered: true, eventId },
      };
    }

    return apiRequest(`/api/events/${eventId}/register`, { method: "DELETE" });
  },

  getCategories() {
    return [
      { id: "all", label: "All Events" },
      { id: "symposium", label: "Symposium" },
      { id: "sports", label: "Sports" },
      { id: "workshop", label: "Workshops" },
      { id: "social", label: "Social" },
      { id: "cultural", label: "Cultural" },
      { id: "academic", label: "Academic" },
    ];
  },
};
