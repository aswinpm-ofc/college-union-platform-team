import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  MapPin,
  AlertCircle,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Card, PageHead, RevealGroup } from "../../../components/common/PagePrimitives";
import { eventsService } from "../../../services/api/eventsService";
import { permissionService } from "../../../services/auth/permissionService";
import NewEventModal from "./NewEventModal";
import EditEventModal from "./EditEventModal";
import EventDetailModal from "./EventDetailModal";

export default function EventsPage() {
  const { notify, user } = useOutletContext();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const userRole = user?.role || "student";
  const canCreate = permissionService.hasPermission("CREATE_EVENT", userRole);
  const canEdit = permissionService.hasPermission("EDIT_EVENT", userRole) || permissionService.hasRole(userRole, ["admin"]);
  const isAdmin = permissionService.hasRole(userRole, ["admin"]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventsService.getEvents();
      if (response.ok) {
        setEvents(response.data);
      } else {
        setError("Failed to load campus events");
      }
    } catch (err) {
      setError(err.message || "Network error loading events");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      notify("Only Administrators can publish new campus events");
      return;
    }
    setShowNewModal(true);
  };

  const handleEventCreated = (newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
    );
    if (selectedEvent?.id === updatedEvent.id) {
      setSelectedEvent((prev) => ({ ...prev, ...updatedEvent }));
    }
  };

  const handleOpenEditModal = (e, evt) => {
    e.stopPropagation();
    if (!canEdit) {
      notify("Only Administrators can edit events");
      return;
    }
    setEditingEvent(evt);
  };

  const handleEventDeleted = (eventId) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleRegisterToggle = (eventId, isRegistered, newAttendeesCount) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, registered: isRegistered, attendees: newAttendeesCount }
          : e
      )
    );
  };

  const handleQuickRegister = async (e, event) => {
    e.stopPropagation();
    const canRegister = permissionService.canPerformAction("REGISTER_EVENT", user);

    if (!canRegister.allowed) {
      if (canRegister.reason === "LOGIN_REQUIRED") {
        notify("Please sign in to register for events");
        navigate("/login");
      } else {
        notify("You cannot register for this event");
      }
      return;
    }

    try {
      if (event.registered) {
        const res = await eventsService.unregisterFromEvent(event.id);
        if (res.ok) {
          const nextAttendees = Math.max(0, (event.attendees || 1) - 1);
          handleRegisterToggle(event.id, false, nextAttendees);
          notify(`Registration cancelled for "${event.title}"`);
        }
      } else {
        const res = await eventsService.registerForEvent(event.id);
        if (res.ok) {
          const nextAttendees = (event.attendees || 0) + 1;
          handleRegisterToggle(event.id, true, nextAttendees);
          notify(`Registered for "${event.title}" ✓`);
        }
      }
    } catch (err) {
      notify("Error updating event registration");
    }
  };

  const handleQuickDelete = async (e, event) => {
    e.stopPropagation();
    if (!isAdmin) {
      notify("Only admins can delete events");
      return;
    }

    const confirmed = window.confirm(`Delete event "${event.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await eventsService.deleteEvent(event.id);
      if (res.ok) {
        handleEventDeleted(event.id);
        notify(`Event "${event.title}" removed ✓`);
      }
    } catch (err) {
      notify("Error deleting event");
    }
  };

  const categories = eventsService.getCategories();

  // Filtered event list
  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = e.title?.toLowerCase().includes(q);
      const matchVenue = e.venue?.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchDesc) return false;
    }
    return true;
  });

  const totalRegisteredCount = events.filter((e) => e.registered).length;

  return (
    <>
      <PageHead
        eyebrow="CAMPUS CALENDAR"
        title="Events & Activities"
        desc="Discover workshops, hackathons, sports championships, and union socials."
        action={
          canCreate ? (
            <button className="primary" onClick={handleOpenCreateModal}>
              <Plus size={16} /> Create event
            </button>
          ) : null
        }
      />

      {/* Metrics Ribbon */}
      <RevealGroup className="stats">
        <div className="stat">
          <div className="stat-icon">
            <CalendarDays size={19} />
          </div>
          <div>
            <small>Total Campus Events</small>
            <strong>{events.length}</strong>
            <span>Active schedule</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <small>My Registered Events</small>
            <strong>{totalRegisteredCount}</strong>
            <span style={{ color: "var(--brand)" }}>Attending</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">
            <Users size={19} />
          </div>
          <div>
            <small>Total RSVPs Across Campus</small>
            <strong>{events.reduce((sum, evt) => sum + (evt.attendees || 0), 0)}</strong>
            <span>Student registrations</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">
            <Sparkles size={19} />
          </div>
          <div>
            <small>Active User Access</small>
            <strong style={{ fontSize: "16px", textTransform: "capitalize" }}>{userRole}</strong>
            <span>{isAdmin ? "Admin Controls Enabled" : "View & RSVP Access"}</span>
          </div>
        </div>
      </RevealGroup>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div className="filterbar" style={{ marginBottom: 0 }}>
          {categories.map((c) => (
            <button
              key={c.id}
              className={selectedCategory === c.id ? "filter active" : "filter"}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="searchbox" style={{ width: "min(320px, 100%)" }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by title, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <div className="loading-state">Loading events...</div>}

      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <CalendarDays size={48} style={{ opacity: 0.4, marginBottom: "12px" }} />
          <h3>No events found</h3>
          <p style={{ color: "var(--muted)" }}>
            {search ? `No events matching "${search}".` : "No events available in this category."}
          </p>
          {canCreate && (
            <button className="primary" onClick={handleOpenCreateModal} style={{ marginTop: "12px" }}>
              <Plus size={16} /> Publish First Event
            </button>
          )}
        </div>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="event-cards">
          {filteredEvents.map((evt) => (
            <Card
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              style={{ position: "relative", overflow: "hidden" }}
            >
              {/* Event Header Poster */}
              <div
                className="poster"
                style={{
                  background:
                    evt.image && (evt.image.startsWith("http") || evt.image.startsWith("data:"))
                      ? `linear-gradient(rgba(12, 17, 34, 0.45), rgba(12, 17, 34, 0.85)), url("${evt.image}") center/cover no-repeat`
                      : evt.category === "sports"
                      ? "linear-gradient(135deg, #172d1f, #2e7d32)"
                      : evt.category === "workshop"
                      ? "linear-gradient(135deg, #2b173d, #7b1fa2)"
                      : evt.category === "social"
                      ? "linear-gradient(135deg, #3d1b17, #c62828)"
                      : "linear-gradient(135deg, #10162a, #4e43c9)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ textTransform: "uppercase", fontSize: "9px" }}>{evt.category}</span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(e, evt)}
                        title="Edit Event"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#ffffff",
                          borderRadius: "6px",
                          padding: "4px 6px",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickDelete(e, evt)}
                        title="Delete Event (Admin)"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#ffcdd2",
                          borderRadius: "6px",
                          padding: "4px 6px",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <small style={{ color: "rgba(255,255,255,0.75)" }}>{evt.date}</small>
                  <b style={{ fontSize: "16px", display: "block", marginTop: "3px" }}>
                    {evt.title}
                  </b>
                </div>
              </div>

              {/* Event Detail Body */}
              <div className="event-detail">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="pill">{evt.category}</span>
                  {evt.registered && (
                    <span className="status green" style={{ fontSize: "9px" }}>
                      ✓ Attending
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "14px", lineHeight: "1.3", margin: "4px 0 8px" }}>
                  {evt.title}
                </h3>

                <p style={{ display: "flex", alignItems: "center", gap: "5px", margin: "6px 0", color: "var(--muted)" }}>
                  <Clock3 size={14} /> {evt.time}
                </p>

                <p style={{ display: "flex", alignItems: "center", gap: "5px", margin: "6px 0", color: "var(--muted)" }}>
                  <MapPin size={14} /> {evt.venue}
                </p>

                <small style={{ display: "block", color: "var(--brand)", fontWeight: 700, margin: "10px 0" }}>
                  {evt.attendees || 0} registered attendees
                </small>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid #f0f1f4", paddingTop: "10px" }}>
                  <button
                    type="button"
                    className={evt.registered ? "outline small" : "primary small"}
                    onClick={(e) => handleQuickRegister(e, evt)}
                    style={{ flex: 1 }}
                  >
                    {evt.registered ? "Registered ✓" : "Register"}
                  </button>
                  <button
                    type="button"
                    className="ghost small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(evt);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin New Event Modal */}
      {showNewModal && (
        <NewEventModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleEventCreated}
          notify={notify}
        />
      )}

      {/* Event Details & Registration Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegisterToggle={handleRegisterToggle}
          onDelete={handleEventDeleted}
          onEdit={(evt) => setEditingEvent(evt)}
          notify={notify}
          isAdmin={isAdmin}
          userRole={userRole}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={handleEventUpdated}
          notify={notify}
        />
      )}
    </>
  );
}