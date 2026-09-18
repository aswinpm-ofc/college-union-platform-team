import React, { useState, useEffect } from "react";
import { X, Bell, ClipboardList } from "lucide-react";
import { grievancesService } from "../../../services/api/grievancesService";

const STATUS_PIPELINE = ["pending", "in-progress", "under-review", "resolved"];

const STATUS_LABELS = {
    pending: "Pending",
    "in-progress": "In Progress",
    "under-review": "Under Review",
    resolved: "Resolved",
};

function statusColor(s) {
    if (s === "resolved") return "green";
    if (s === "in-progress") return "amber";
    if (s === "under-review") return "amber";
    return "";
}

export default function GrievanceDetailModal({ grievance, onClose, onStatusUpdate, notify, isAdmin }) {
    const [detail, setDetail] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        grievancesService.getGrievanceDetails(grievance.id).then((res) => {
            if (res.ok) setDetail(res.data);
        });
    }, [grievance.id]);

    const currentIdx = STATUS_PIPELINE.indexOf(grievance.status);
    const nextStatus = STATUS_PIPELINE[currentIdx + 1];

    const handleTrack = () => {
        setTracking(true);
        notify(`Tracking enabled for ${grievance.id} — you'll be notified on status changes`);
    };

    const handleForward = async () => {
        if (!nextStatus) return;
        setUpdating(true);
        const res = await grievancesService.updateGrievanceStatus(grievance.id, nextStatus);
        if (res.ok) {
            onStatusUpdate(grievance.id, nextStatus);
            notify(`${grievance.id} moved to ${STATUS_LABELS[nextStatus]}`);
            onClose();
        }
        setUpdating(false);
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
            <div className="card" style={{ width: "min(580px,100%)", maxHeight: "85vh", overflowY: "auto", position: "relative", cursor: "default" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
                    <div className="g-icon"><ClipboardList size={18} /></div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, color: "var(--muted)" }}>{grievance.id}</span>
                            <span className={"status " + statusColor(grievance.status)}>
                                {STATUS_LABELS[grievance.status] || grievance.status}
                            </span>
                        </div>
                        <b style={{ fontSize: 15, display: "block", marginTop: 4 }}>{grievance.title}</b>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, marginTop: -2 }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Status timeline */}
                <div className="timeline" style={{ marginTop: 0 }}>
                    {STATUS_PIPELINE.map((s, i) => {
                        const done = i <= currentIdx;
                        const active = i === currentIdx;
                        return (
                            <div key={s} className={done ? "done" : ""} style={{ fontWeight: active ? 700 : 400 }}>
                                <span style={{
                                    width: 23, height: 23, borderRadius: "50%",
                                    background: done ? "var(--greenbg)" : "#f1f3f5",
                                    display: "grid", placeItems: "center",
                                    border: active ? "2px solid var(--green)" : "none",
                                }}>
                                    {done ? "✓" : ""}
                                </span>
                                <b style={{ fontSize: 11 }}>{STATUS_LABELS[s]}</b>
                            </div>
                        );
                    })}
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "14px 0" }} />

                {/* Details */}
                <div style={{ display: "grid", gap: 10, fontSize: 12 }}>
                    <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Description</span>
                        <p style={{ margin: "4px 0 0", fontSize: 13 }}>{grievance.description}</p>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Category</span>
                            <p style={{ margin: "4px 0 0" }}>{grievance.category}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Priority</span>
                            <p style={{ margin: "4px 0 0" }}>{grievance.priority}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Submitted</span>
                            <p style={{ margin: "4px 0 0" }}>{grievance.createdAt}</p>
                        </div>
                    </div>
                    {grievance.response && (
                        <div style={{ background: "var(--soft)", borderRadius: 9, padding: "10px 13px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase" }}>Admin Response</span>
                            <p style={{ margin: "4px 0 0", fontSize: 12 }}>{grievance.response}</p>
                        </div>
                    )}
                </div>

                {/* Comments */}
                {detail?.comments?.length > 0 && (
                    <>
                        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "14px 0" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Updates</span>
                        {detail.comments.map((c) => (
                            <div key={c.id} className="update" style={{ marginTop: 6 }}>
                                <div className="dot" />
                                <div>
                                    <b style={{ fontSize: 11 }}>{c.author}</b>
                                    <span style={{ fontSize: 11, color: "var(--ink)", marginTop: 3, display: "block" }}>{c.text}</span>
                                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{c.timestamp}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    {!tracking && !isAdmin && (
                        <button className="outline" style={{ flex: 1 }} onClick={handleTrack}>
                            <Bell size={13} /> Track this grievance
                        </button>
                    )}
                    {tracking && (
                        <div style={{ flex: 1, fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Bell size={13} /> Tracking — notifications enabled
                        </div>
                    )}
                    {isAdmin && nextStatus && (
                        <button className="primary" style={{ flex: 1 }} onClick={handleForward} disabled={updating}>
                            {updating ? "Updating..." : `Forward → ${STATUS_LABELS[nextStatus]}`}
                        </button>
                    )}
                    {isAdmin && !nextStatus && (
                        <span style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                            ✓ Fully resolved
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}