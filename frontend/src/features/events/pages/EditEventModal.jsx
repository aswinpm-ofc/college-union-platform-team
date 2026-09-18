import React, { useState, useRef } from "react";
import {
  X,
  Edit3,
  Image,
  Upload,
  AlertCircle,
} from "lucide-react";
import { eventsService } from "../../../services/api/eventsService";

export default function EditEventModal({ event, onClose, onUpdated, notify }) {
  const [form, setForm] = useState({
    title: event?.title || "",
    category: event?.category || "symposium",
    date: event?.date || "",
    time: event?.time || "10:00 AM",
    venue: event?.venue || "",
    description: event?.description || "",
    image: event?.image || "",
    speakers: Array.isArray(event?.speakers)
      ? event?.speakers.join(", ")
      : event?.speakers || "",
    agenda: Array.isArray(event?.agenda)
      ? event?.agenda.join("\n")
      : event?.agenda || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const categories = eventsService.getCategories().filter((c) => c.id !== "all");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError("Image file size should be less than 3MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setForm((prev) => ({ ...prev, image: uploadEvt.target.result }));
        if (error) setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Event title is required");
      return;
    }
    if (!form.date) {
      setError("Please select a date for the event");
      return;
    }
    if (!form.venue.trim()) {
      setError("Event venue is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Event description is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await eventsService.updateEvent(event.id, form);
      if (response.ok) {
        onUpdated(response.data);
        notify(`Event "${form.title}" updated successfully! ✓`);
        onClose();
      } else {
        setError(response.data?.error || "Failed to update event. Please try again.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred while updating the event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
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
          width: "min(640px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          cursor: "default",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--soft)",
                color: "var(--brand)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Edit3 size={19} />
            </div>
            <div>
              <b style={{ fontSize: "16px", display: "block" }}>Edit Campus Event</b>
              <small style={{ color: "var(--muted)" }}>Update event schedule, venue, or details</small>
            </div>
          </div>
          <button
            type="button"
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

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "9px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#b42318",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Event Title *</span>
            <input
              type="text"
              placeholder="e.g. Annual Robowars & AI Summit 2026"
              value={form.title}
              onChange={handleChange("title")}
              style={{
                height: "42px",
                padding: "0 12px",
                border: "1px solid var(--line)",
                borderRadius: "9px",
                fontSize: "13px",
                outline: "none",
                background: "#fbfcff",
              }}
            />
          </label>

          {/* Cover Image Section */}
          <div style={{ display: "grid", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467", display: "flex", alignItems: "center", gap: "5px" }}>
                <Image size={13} /> Cover Image (URL or Upload)
              </span>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>Optional</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="url"
                  placeholder="Paste image URL (e.g. https://...)"
                  value={form.image}
                  onChange={handleChange("image")}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 12px",
                    border: "1px solid var(--line)",
                    borderRadius: "9px",
                    fontSize: "12px",
                    outline: "none",
                    background: "#fbfcff",
                  }}
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              <button
                type="button"
                className="outline"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: "42px",
                  padding: "0 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <Upload size={14} /> Upload File
              </button>
            </div>

            {/* Live Cover Preview */}
            {form.image && (
              <div
                style={{
                  position: "relative",
                  borderRadius: "9px",
                  overflow: "hidden",
                  height: "120px",
                  border: "1px solid var(--line)",
                  marginTop: "6px",
                  background: "#0c1122",
                }}
              >
                <img
                  src={form.image}
                  alt="Cover preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.3";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: "#fff", fontWeight: 600 }}>
                    Cover preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      color: "#ffcdd2",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Category *</span>
              <select
                value={form.category}
                onChange={handleChange("category")}
                style={{
                  height: "42px",
                  padding: "0 10px",
                  border: "1px solid var(--line)",
                  borderRadius: "9px",
                  fontSize: "12px",
                  background: "#fff",
                  color: "var(--ink)",
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Venue / Location *</span>
              <input
                type="text"
                placeholder="e.g. Auditorium B or Main Ground"
                value={form.venue}
                onChange={handleChange("venue")}
                style={{
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "9px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fbfcff",
                }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Date *</span>
              <input
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                style={{
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "9px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fbfcff",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Time *</span>
              <input
                type="text"
                placeholder="e.g. 10:00 AM - 4:00 PM"
                value={form.time}
                onChange={handleChange("time")}
                style={{
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "9px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fbfcff",
                }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>Description *</span>
            <textarea
              rows={3}
              placeholder="Detailed description of what the event covers..."
              value={form.description}
              onChange={handleChange("description")}
              style={{
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: "9px",
                fontSize: "13px",
                outline: "none",
                background: "#fbfcff",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>
              Speakers / Guests (Comma-separated)
            </span>
            <input
              type="text"
              placeholder="e.g. Prof. Arvind Kumar, Dr. Sarah Thomas"
              value={form.speakers}
              onChange={handleChange("speakers")}
              style={{
                height: "42px",
                padding: "0 12px",
                border: "1px solid var(--line)",
                borderRadius: "9px",
                fontSize: "13px",
                outline: "none",
                background: "#fbfcff",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475467" }}>
              Schedule / Agenda (One per line)
            </span>
            <textarea
              rows={3}
              placeholder="10:00 AM — Registration & Keynote&#10;11:30 AM — Technical Workshop&#10;02:00 PM — Valedictory Session"
              value={form.agenda}
              onChange={handleChange("agenda")}
              style={{
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: "9px",
                fontSize: "13px",
                outline: "none",
                background: "#fbfcff",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              className="outline"
              onClick={onClose}
              style={{ flex: 1, height: "42px" }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              style={{ flex: 1, height: "42px" }}
              disabled={submitting}
            >
              {submitting ? "Saving changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
