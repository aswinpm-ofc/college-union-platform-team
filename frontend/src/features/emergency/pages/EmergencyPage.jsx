import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { CircleAlert, HeartPulse, Phone, ShieldAlert, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { emergencyService } from "../../../services/api/emergencyService";

const typeIcons = {
  medical: HeartPulse,
  security: ShieldAlert,
  administrative: ShieldCheck,
  counseling: HeartPulse,
};

export default function EmergencyPage() {
  const { notify } = useOutletContext();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emergencyService.getEmergencyContacts();
      if (response.ok) {
        setContacts(response.data);
      } else {
        setError("Failed to load emergency contacts");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="ONE-TAP ACCESS"
        title="Emergency Hub"
        desc="Verified campus emergency contacts. Use only when needed."
      />

      <div className="emergency-banner">
        <CircleAlert size={22} />
        <div>
          <b>Emergency numbers are verified by the institution.</b>
          <span>Last verification: Aug 28, 2026</span>
        </div>
      </div>

      {loading && <div className="loading-state">Loading emergency contacts...</div>}

      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="emergency-grid">
            {contacts.map((contact) => {
              const Icon = typeIcons[contact.type] || ShieldAlert;
              return (
                <Card key={contact.id}>
                  <div className="em-icon">
                    <Icon />
                  </div>
                  <span className="eyebrow">VERIFIED CONTACT</span>
                  <h2>{contact.name}</h2>
                  <p>{contact.available24h ? "Available 24/7" : "Business hours"}</p>
                  <small style={{ display: "block", marginBottom: "10px" }}>
                    {contact.location}
                  </small>
                  <button
                    className="call"
                    onClick={() => notify(`Demo: calling ${contact.name}`)}
                  >
                    <Phone size={17} /> Call
                  </button>
                </Card>
              );
            })}
          </div>

          <p className="hint">
            <ShieldCheck size={14} /> This demo does not dispatch emergency services.
          </p>
        </>
      )}
    </>
  );
}