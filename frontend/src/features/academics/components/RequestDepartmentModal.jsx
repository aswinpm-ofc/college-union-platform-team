import React, { useState, useRef, useEffect } from "react";
import { X, Loader, Building2, AlertCircle } from "lucide-react";
import { academicsService } from "../../../services/api/academicsService";

export default function RequestDepartmentModal({ onClose, onSuccess, notify }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Department code is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await academicsService.requestNewDepartment({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        reason: reason.trim(),
      });

      if (res.ok) {
        if (typeof notify === "function") {
          notify(res.message || "Department request submitted successfully ✓");
        }
        if (typeof onSuccess === "function") {
          onSuccess();
        }
        onClose();
      } else {
        setError(res.error || "Failed to submit department request.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line, #e5e7eb)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="var(--brand, #6557e8)" />
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Request New Department</h3>
          </div>
          <button
            className="textbtn"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted, #6b7280)", lineHeight: 1.5 }}>
            Can't find your department? Submit a request and a maintainer will review and add it.
          </p>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
              Department Name *
            </label>
            <input
              ref={nameRef}
              type="text"
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--line, #d1d5db)",
                borderRadius: "8px",
                fontSize: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
              Department Code *
            </label>
            <input
              type="text"
              placeholder="e.g. AI, AIDS, CY"
              value={code}
              maxLength={8}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={submitting}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--line, #d1d5db)",
                borderRadius: "8px",
                fontSize: "12px",
                textTransform: "uppercase",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
              Reason / Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Newly introduced branch for B.Tech batch..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--line, #d1d5db)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                color: "#b91c1c",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="outline small"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary small"
              disabled={submitting}
              style={{ minWidth: "120px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {submitting ? (
                <>
                  <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                  Submitting…
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}