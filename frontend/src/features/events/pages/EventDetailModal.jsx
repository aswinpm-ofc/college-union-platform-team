import React, { useState, useEffect } from "react";
import {
  X,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Mic,
  ListOrdered,
  AlertTriangle,
} from "lucide-react";
import { eventsService } from "../../../services/api/eventsService";
import { permissionService } from "../../../services/auth/permissionService";

export default function EventDetailModal({
  event,
  onClose,
  onRegisterToggle,
  onDelete,
  onEdit,
  notify,
  isAdmin,
  userRole,
}) {
  const [detail, setDetail] = useState(event);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canEdit = permissionService.hasPermission("EDIT_EVENT", userRole) || isAdmin;

  useEffect(() => {
    setDetail((prev) => ({ ...prev, ...event }));
  }, [event]);

  useEffect(() => {
    let isMounted = true;
    setLoadingDetail(true);
    eventsService.getEventDetails(event.id).then((res) => {
      if (isMounted && res.ok) {
        setDetail((prev) => ({ ...prev, ...res.data }));
      }
      if (isMounted) setLoadingDetail(false);
    });
    return () => {
      isMounted = false;
    };
  }, [event.id]);

  const handleToggleRegister = async () => {
    const canRegister = permissionService.hasPermission("REGISTER_EVENT", userRole);
    if (!canRegister) {
      notify("You do not have permission to register for events");
      return;
    }

    setRegistering(true);
    const wasRegistered = detail.registered;

    try {
      if (wasRegistered) {
        const res = await eventsService.unregisterFromEvent(detail.id);
        if (res.ok) {
          const nextAttendees = Math.max(0, (detail.attendees || 1) - 1);
          setDetail((prev) => ({ ...prev, registered: false, attendees: nextAttendees }));
          onRegisterToggle(detail.id, false, nextAttendees);
          notify(`Registration cancelled for "${detail.title}"`);
        }
      } else {
        const res = await eventsService.registerForEvent(detail.id);
        if (res.ok) {
          const nextAttendees = (detail.attendees || 0) + 1;
          setDetail((prev) => ({ ...prev, registered: true, attendees: nextAttendees }));
          onRegisterToggle(detail.id, true, nextAttendees);
          notify(`Successfully registered for "${detail.title}" ✓`);
        }
      }
    } catch (err) {
      notify("Failed to update registration");
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      notify("Only administrators can delete events");
      return;
    }

    setDeleting(true);
    try {
      const res = await eventsService.deleteEvent(detail.id);
      if (res.ok) {
        notify(`Event "${detail.title}" deleted ✓`);
        onDelete(detail.id);
        onClose();
      } else {
        notify("Failed to delete event");
      }
    } catch (err) {
      notify("Error deleting event");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(11, 16, 32, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{
          width: "min(680px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          position: "relative",
          cursor: "default",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
        }}
      >
        {/* Cover Image Banner */}
        {detail.image && (detail.image.startsWith("http") || detail.image.startsWith("data:")) && (
          <div
            style={{
              width: "100%",
              height: "170px",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "16px",
              background: "#0d1322",
              border: "1px solid var(--line)",
            }}
          >
            <img
              src={detail.image}
              alt={detail.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="pill" style={{ textTransform: "uppercase" }}>
                {detail.category}
              </span>
              {detail.registered && (
                <span
                  className="status green"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <CheckCircle2 size={12} /> You are registered
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "20px", margin: "0 0 4px", color: "var(--ink)" }}>
              {detail.title}
            </h2>
            <small style={{ color: "var(--muted)" }}>Event ID: {detail.id}</small>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              padding: "6px",
              cursor: "pointer",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Highlights Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#f8f9fc",
              border: "1px solid var(--line)",
            }}
          >
            <small
              style={{
                color: "var(--muted)",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CalendarDays size={12} /> DATE
            </small>
            <b style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>{detail.date}</b>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#f8f9fc",
              border: "1px solid var(--line)",
            }}
          >
            <small
              style={{
                color: "var(--muted)",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock3 size={12} /> TIME
            </small>
            <b style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>{detail.time}</b>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#f8f9fc",
              border: "1px solid var(--line)",
            }}
          >
            <small
              style={{
                color: "var(--muted)",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <MapPin size={12} /> VENUE
            </small>
            <b style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>{detail.venue}</b>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#f8f9fc",
              border: "1px solid var(--line)",
            }}
          >
            <small
              style={{
                color: "var(--muted)",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Users size={12} /> ATTENDEES
            </small>
            <b style={{ fontSize: "12px", display: "block", marginTop: "4px", color: "var(--brand)" }}>
              {detail.attendees || 0} registered
            </b>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "18px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "var(--muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}
          >
            About this event
          </span>
          <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#344054", margin: 0 }}>
            {detail.description}
          </p>
        </div>

        {/* Speakers / Dignitaries */}
        {detail.speakers && detail.speakers.length > 0 && (
          <div style={{ marginBottom: "18px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "8px",
              }}
            >
              <Mic size={13} /> Featured Speakers & Organizers
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {detail.speakers.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--soft)",
                    color: "var(--brand2)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--brand)",
                    }}
                  />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule / Agenda */}
        {detail.agenda && detail.agenda.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "8px",
              }}
            >
              <ListOrdered size={13} /> Schedule & Agenda
            </span>
            <div
              style={{
                background: "#fafbfc",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "grid",
                gap: "8px",
              }}
            >
              {detail.agenda.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#344054",
                  }}
                >
                  <span
                    style={{
                      color: "var(--brand)",
                      fontWeight: 800,
                      minWidth: "18px",
                    }}
                  >
                    0{idx + 1}.
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Delete Confirmation Alert */}
        {confirmDelete && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b42318" }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                Are you sure you want to permanently delete this event?
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="outline small"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reject small"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            borderTop: "1px solid var(--line)",
            paddingTop: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {canEdit && (
              <button
                type="button"
                className="outline"
                onClick={() => onEdit && onEdit(detail)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Edit3 size={14} /> Edit Event
              </button>
            )}
            {isAdmin && !confirmDelete && (
              <button
                type="button"
                className="reject"
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Trash2 size={14} /> Delete Event
              </button>
            )}
            {!canEdit && !isAdmin && (
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                {detail.registered ? "You are attending this event." : "Open for all students."}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            <button type="button" className="outline" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className={detail.registered ? "outline" : "primary"}
              onClick={handleToggleRegister}
              disabled={registering}
              style={{ minWidth: "150px" }}
            >
              {registering
                ? "Updating..."
                : detail.registered
                ? "Cancel Registration"
                : "Register for Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
