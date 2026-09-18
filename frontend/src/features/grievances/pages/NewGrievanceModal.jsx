import React, { useState } from "react";
import { X, Bell } from "lucide-react";
import { grievancesService } from "../../../services/api/grievancesService";

export default function NewGrievanceModal({ onClose, onSubmitted, notify }) {
    const [form, setForm] = useState({ title: "", category: "", description: "", priority: "medium" });
    const [trackOnSubmit, setTrackOnSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const categories = grievancesService.getCategories();

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.title || !form.category || !form.description) {
            setError("All fields are required");
            return;
        }
        setSubmitting(true);
        setError(null);
        const res = await grievancesService.submitGrievance(form);
        if (res.ok) {
            onSubmitted(res.data, trackOnSubmit);
            notify(trackOnSubmit
                ? "Grievance submitted — notifications enabled"
                : "Grievance submitted"
            );
            onClose();
        } else {
            setError("Submission failed. Try again.");
        }
        setSubmitting(false);
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 100,
                background: "rgba(0,0,0,0.45)", display: "flex",
                alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="card" style={{ width: "min(500px,100%)", cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <b style={{ fontSize: 15 }}>New Grievance</b>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>
                )}

                <div style={{ display: "grid", gap: 13 }}>
                    <label className="login-form">
                        <span>Title</span>
                        <input value={form.title} onChange={set("title")} placeholder="Brief description of the issue" />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <label>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#475467", display: "block", marginBottom: 5 }}>Category</span>
                            <select value={form.category} onChange={set("category")} style={{ width: "100%", padding: "9px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 11 }}>
                                <option value="">Select...</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#475467", display: "block", marginBottom: 5 }}>Priority</span>
                            <select value={form.priority} onChange={set("priority")} style={{ width: "100%", padding: "9px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 11 }}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </label>
                    </div>

                    <label>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#475467", display: "block", marginBottom: 5 }}>Description</span>
                        <textarea
                            value={form.description}
                            onChange={set("description")}
                            placeholder="Provide details..."
                            rows={4}
                            style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "#fbfcff", fontSize: 12, resize: "vertical", fontFamily: "inherit" }}
                        />
                    </label>

                    {/* Track toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: "var(--soft)", borderRadius: 9 }}>
                        <Bell size={14} color="var(--brand)" />
                        <span style={{ fontSize: 11, flex: 1 }}>Notify me on status updates</span>
                        <input type="checkbox" checked={trackOnSubmit} onChange={(e) => setTrackOnSubmit(e.target.checked)} style={{ accentColor: "var(--brand)", width: 15, height: 15 }} />
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <button className="outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                    <button className="primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit grievance"}
                    </button>
                </div>
            </div>
        </div>
    );
}