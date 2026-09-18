import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Droplets,
  HeartPulse,
  Phone,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  X,
  Lock,
  PhoneCall,
  Ambulance,
  ShieldAlert,
  Send,
  Building2,
  FileText,
  PlusCircle,
  MapPin,
  Users,
  Megaphone,
} from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { bloodBankService } from "../../../services/api/bloodBankService";
import "../BloodBank.css";

export default function BloodBankPage() {
  const { notify } = useOutletContext();
  const [activeTab, setActiveTab] = useState("donors"); // "donors" | "requests"
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [helplines, setHelplines] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [requestFilter, setRequestFilter] = useState("ALL"); // "ALL" | "CRITICAL" | "SEARCHING" | "FULFILLED"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request modal state
  const [targetDonor, setTargetDonor] = useState(null);
  const [isGeneralRequestModal, setIsGeneralRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    bloodGroup: "O+",
    hospital: "",
    units: "1 unit",
    urgency: "high",
    contact: "",
    notes: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedBloodGroup, eligibleOnly]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [donorsRes, requestsRes, helplinesRes] = await Promise.all([
        bloodBankService.getDonors({
          bloodGroup: selectedBloodGroup === "ALL" ? null : selectedBloodGroup,
          eligibleOnly,
          searchQuery,
        }),
        bloodBankService.getRequests(),
        bloodBankService.getHelplines(),
      ]);

      if (donorsRes.ok) setDonors(donorsRes.data);
      if (requestsRes.ok) setRequests(requestsRes.data);
      if (helplinesRes.ok) setHelplines(helplinesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenRequestModal = (donor = null) => {
    setTargetDonor(donor);
    setIsGeneralRequestModal(!donor);
    setFormError(null);
    setRequestForm({
      bloodGroup: donor ? donor.bloodGroup : "O+",
      hospital: "City Medical Center, Emergency Ward",
      units: "1 unit",
      urgency: "high",
      contact: "+91 ",
      notes: donor ? `Urgent requirement for ${donor.bloodGroup} blood.` : "Emergency blood required.",
    });
    setUnlockedContact(null);
  };

  const handleSubmitBloodRequest = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!requestForm.hospital.trim() || !requestForm.contact.trim() || requestForm.contact.trim() === "+91") {
      setFormError("Hospital location and emergency contact number are mandatory fields.");
      return;
    }
    if (!requestForm.notes.trim()) {
      setFormError("Please provide patient details / medical notes.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const payload = {
        bloodGroup: targetDonor ? targetDonor.bloodGroup : requestForm.bloodGroup,
        hospital: requestForm.hospital,
        units: requestForm.units,
        urgency: requestForm.urgency,
        contact: targetDonor ? targetDonor.contact : requestForm.contact,
        notes: targetDonor ? `Emergency request sent to ${targetDonor.name} (${targetDonor.department}). ${requestForm.notes}` : requestForm.notes,
        requester: targetDonor ? `Request for ${targetDonor.name}` : "Campus Emergency Request",
        targetDonorName: targetDonor ? targetDonor.name : null,
      };

      const res = await bloodBankService.createRequest(payload);
      if (res.ok) {
        notify("Blood request added to blood_requests table!");
        setSelectedBloodGroup(payload.bloodGroup);
        setActiveTab("donors");
        if (targetDonor) {
          setUnlockedContact(targetDonor.contact);
        } else {
          setTargetDonor(null);
          setIsGeneralRequestModal(false);
        }
        loadData();
      }
    } catch (err) {
      notify("Error submitting blood request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleFulfillRequest = async (requestId) => {
    try {
      const res = await bloodBankService.updateRequestStatus(requestId, "fulfilled");
      if (res.ok) {
        notify("Request marked as FULFILLED! Thank you.");
        loadData();
      }
    } catch (err) {
      notify("Error updating request status");
    }
  };

  const bloodGroups = ["ALL", ...bloodBankService.getBloodGroups()];

  const getBloodGroupCount = (bg) => {
    if (bg === "ALL") return donors.length;
    return donors.filter((d) => d.bloodGroup === bg).length;
  };

  const eligibleCount = donors.filter((d) => {
    const { isEligible } = bloodBankService.calculateEligibility(d.lastDonation);
    return isEligible;
  }).length;

  // Filter requests for requests tab
  const filteredRequests = requests.filter((req) => {
    if (requestFilter === "CRITICAL") return req.urgency === "critical" || req.urgency === "high";
    if (requestFilter === "SEARCHING") return req.status === "searching" || req.status === "open";
    if (requestFilter === "FULFILLED") return req.status === "fulfilled";
    return true;
  });

  return (
    <div className="blood-bank-container">
      <PageHead
        eyebrow="CAMPUS LIFE SAVER NETWORK"
        title="Blood Bank & Emergency Portal"
        desc="Browse verified student blood donors, view sent blood requests, and respond to campus medical needs."
      />

      {/* 2026 Emergency & Saviour Hero */}
      <div className="blood-hero-2026">
        <div className="blood-hero-content">
          <div>
            <div className="blood-hero-tag">
              <span className="pulse-dot"></span>
              2026 Emergency Blood Network Active
            </div>
            <h2 className="blood-hero-title">Verified Campus Donors. Immediate Support.</h2>
            <p className="blood-hero-desc">
              Donor contact numbers are protected by default. Submitting a request creates an entry in the blood_requests registry and unlocks contact details for emergency responders.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
              <button
                className="primary"
                onClick={() => handleOpenRequestModal(null)}
                style={{ background: "#f43f5e" }}
              >
                <PlusCircle size={16} /> Post Emergency Blood Request
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", position: "relative" }}>
            <Droplets size={100} color="#fecdd3" style={{ opacity: 0.85, filter: "drop-shadow(0 0 15px rgba(244,63,94,0.6))" }} />
          </div>
        </div>
      </div>

      {/* Campus Emergency Helplines Section */}
      <div className="emergency-helplines-card">
        <div className="helplines-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={24} color="#fecdd3" />
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Campus Emergency & Medical Helplines</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#fecdd3" }}>24/7 direct lines for emergency medical transport & campus blood unit</p>
            </div>
          </div>
        </div>

        <div className="helplines-grid">
          {helplines.map((help) => (
            <div key={help.id} className="helpline-box">
              <div>
                <h4>{help.title}</h4>
                <p>{help.description}</p>
              </div>
              <a href={`tel:${help.phone.replace(/[^0-9+]/g, "")}`}>
                <PhoneCall size={14} /> Call {help.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="blood-nav-tabs">
        <button
          className={`blood-tab-btn ${activeTab === "donors" ? "active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          <Users size={18} />
          Registered Donors Directory
          <span className="blood-tab-badge">{donors.length}</span>
        </button>

        <button
          className={`blood-tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <Megaphone size={18} />
          Blood Requests
          <span className="blood-tab-badge">{requests.length}</span>
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="blood-stats-grid">
        <div className="blood-stat-card">
          <div className="blood-stat-icon red">
            <HeartPulse size={22} />
          </div>
          <div className="blood-stat-info">
            <strong>{donors.length}</strong>
            <span>Registered Donors</span>
          </div>
        </div>

        <div className="blood-stat-card">
          <div className="blood-stat-icon emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="blood-stat-info">
            <strong>{eligibleCount}</strong>
            <span>Eligible Today</span>
          </div>
        </div>

        <div className="blood-stat-card">
          <div className="blood-stat-icon amber">
            <Clock size={22} />
          </div>
          <div className="blood-stat-info">
            <strong>{donors.length - eligibleCount}</strong>
            <span>In 90-Day Cooldown</span>
          </div>
        </div>

        <div className="blood-stat-card">
          <div className="blood-stat-icon rose">
            <AlertCircle size={22} />
          </div>
          <div className="blood-stat-info">
            <strong>{requests.length}</strong>
            <span>Active Blood Requests</span>
          </div>
        </div>
      </div>

      {/* TAB 1: DONORS DIRECTORY */}
      {activeTab === "donors" && (
        <>
          {/* Blood Group Filter & Search Bar */}
          <div className="blood-filter-section">
            <div className="blood-filter-top">
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Blood Donors Directory ({donors.length})
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Filter by blood group or search by student name/department.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="blood-search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search donor by name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Blood Group Filter Pills */}
            <div className="blood-groups-pills">
              {bloodGroups.map((bg) => {
                const count = getBloodGroupCount(bg);
                return (
                  <button
                    key={bg}
                    className={`blood-pill ${selectedBloodGroup === bg ? "active" : ""}`}
                    onClick={() => setSelectedBloodGroup(bg)}
                  >
                    <span>{bg === "ALL" ? "All Groups" : bg}</span>
                    <span className="blood-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "14px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  style={{ accentColor: "#e11d48" }}
                />
                Show <b>Eligible Donors Only</b> (Ready to donate today)
              </label>
            </div>
          </div>

          {/* Donors Cards List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              <Droplets className="spin" size={32} color="#e11d48" />
              <p style={{ marginTop: "12px", fontSize: "13px" }}>Loading verified blood donors...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          ) : donors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#ffffff", borderRadius: "18px", border: "1px dashed #cbd5e1" }}>
              <Droplets size={44} color="#f43f5e" style={{ opacity: 0.5 }} />
              <h4 style={{ margin: "12px 0 6px 0", fontSize: "16px", color: "#0f172a" }}>No Donors Found</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                No donors match the selected blood group or search query.
              </p>
            </div>
          ) : (
            <div className="donor-cards-grid">
              {donors.map((donor) => {
                const { isEligible } = bloodBankService.calculateEligibility(donor.lastDonation);
                return (
                  <div key={donor.id} className="donor-card-2026">
                    <div>
                      <div className="donor-card-top">
                        <div className="donor-blood-badge">
                          {donor.bloodGroup}
                          <span>{donor.bloodGroup === "O-" ? "Universal" : "Group"}</span>
                        </div>

                        <div className="donor-meta">
                          <h4>
                            {donor.name}
                            {donor.verified && <ShieldCheck size={16} color="#2563eb" title="Verified Saviour" />}
                          </h4>
                          <span className="donor-dept">{donor.department || "Campus Student"}</span>

                          <div className="donor-tags-row">
                            {isEligible ? (
                              <span className="donor-tag eligible">
                                <CheckCircle2 size={10} /> Ready to Donate
                              </span>
                            ) : (
                              <span className="donor-tag cooldown">
                                <Clock size={10} /> Cooldown
                              </span>
                            )}
                            <span className="privacy-badge">
                              <Lock size={10} /> Contact Locked
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="donor-donation-info">
                        <Calendar size={14} />
                        <span>
                          {donor.lastDonation ? `Last donated: ${donor.lastDonation}` : "First-time donor"}
                        </span>
                      </div>
                    </div>

                    <div className="donor-card-actions">
                      <button
                        className="btn-request-blood"
                        onClick={() => handleOpenRequestModal(donor)}
                      >
                        <HeartPulse size={15} /> Request Blood (Creates Request)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: BLOOD REQUESTS */}
      {activeTab === "requests" && (
        <>
          <div className="blood-filter-section">
            <div className="blood-filter-top">
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Blood Requests ({requests.length})
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Emergency and general blood requests registered in the platform database (`blood_requests` table).
                </p>
              </div>

              <button
                className="primary"
                onClick={() => handleOpenRequestModal(null)}
                style={{ background: "#e11d48" }}
              >
                <PlusCircle size={15} /> Create New Blood Request
              </button>
            </div>

            {/* Filter pills for requests */}
            <div className="blood-groups-pills">
              <button
                className={`blood-pill ${requestFilter === "ALL" ? "active" : ""}`}
                onClick={() => setRequestFilter("ALL")}
              >
                All Requests ({requests.length})
              </button>
              <button
                className={`blood-pill ${requestFilter === "CRITICAL" ? "active" : ""}`}
                onClick={() => setRequestFilter("CRITICAL")}
              >
                Urgent / Critical ({requests.filter((r) => r.urgency === "critical" || r.urgency === "high").length})
              </button>
              <button
                className={`blood-pill ${requestFilter === "SEARCHING" ? "active" : ""}`}
                onClick={() => setRequestFilter("SEARCHING")}
              >
                Open / Searching ({requests.filter((r) => r.status === "searching" || r.status === "open").length})
              </button>
              <button
                className={`blood-pill ${requestFilter === "FULFILLED" ? "active" : ""}`}
                onClick={() => setRequestFilter("FULFILLED")}
              >
                Fulfilled ({requests.filter((r) => r.status === "fulfilled").length})
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#ffffff", borderRadius: "18px", border: "1px dashed #cbd5e1" }}>
              <AlertCircle size={44} color="#f43f5e" style={{ opacity: 0.5 }} />
              <h4 style={{ margin: "12px 0 6px 0", fontSize: "16px", color: "#0f172a" }}>No Requests Found</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                No sent blood requests match the selected filter.
              </p>
            </div>
          ) : (
            <div className="requests-grid">
              {filteredRequests.map((req) => (
                <div key={req.id} className={`request-card-2026 ${req.urgency === "critical" ? "critical" : ""}`}>
                  <div>
                    <div className="request-card-top">
                      <div className="donor-blood-badge">
                        {req.bloodGroup}
                        <span>{req.units || "Blood"}</span>
                      </div>

                      <div className="donor-meta">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ margin: 0 }}>{req.requester}</h4>
                          <span className={`request-urgency-tag ${req.urgency}`}>
                            {req.urgency === "critical" ? "🔴 CRITICAL" : req.urgency === "high" ? "🟧 Urgent" : "🟢 Open"}
                          </span>
                        </div>
                        <span className="donor-dept" style={{ marginTop: "4px" }}>
                          Posted: {req.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="request-details-box">
                      <div className="request-detail-item">
                        <MapPin size={15} />
                        <span><strong>Hospital / Location:</strong> {req.hospital}</span>
                      </div>

                      <div className="request-detail-item">
                        <Phone size={15} />
                        <span><strong>Emergency Contact:</strong> {req.contact}</span>
                      </div>

                      {req.notes && (
                        <div className="request-detail-item">
                          <FileText size={15} />
                          <span><strong>Notes:</strong> {req.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                    <a
                      href={`tel:${req.contact.replace(/[^0-9+]/g, "")}`}
                      className="btn-request-blood"
                      style={{ textDecoration: "none" }}
                    >
                      <PhoneCall size={14} /> Call Attendant
                    </a>

                    {req.status !== "fulfilled" ? (
                      <button
                        className="btn-contact-outline"
                        onClick={() => handleFulfillRequest(req.id)}
                      >
                        <CheckCircle2 size={14} color="#16a34a" /> Mark Fulfilled
                      </button>
                    ) : (
                      <span className="pill status green" style={{ alignSelf: "center", padding: "8px 12px", fontSize: "11px" }}>
                        ✓ Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Dialog for Submitting Blood Request */}
      {(targetDonor || isGeneralRequestModal) && (
        <div className="blood-modal-overlay" onClick={() => { setTargetDonor(null); setIsGeneralRequestModal(false); }}>
          <div className="blood-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <HeartPulse size={24} color="#e11d48" />
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  {targetDonor ? `Request Blood from ${targetDonor.name}` : "Create General Blood Request"}
                </h3>
              </div>
              <button
                onClick={() => { setTargetDonor(null); setIsGeneralRequestModal(false); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {targetDonor && (
              <div style={{ background: "#fff1f2", padding: "12px 14px", borderRadius: "12px", border: "1px solid #fecdd3", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div className="donor-blood-badge" style={{ width: "42px", height: "46px", fontSize: "15px" }}>
                    {targetDonor.bloodGroup}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#881337" }}>Requested Donor: {targetDonor.name}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#9f1239" }}>
                      {targetDonor.department}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {unlockedContact ? (
              <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#16a34a", marginBottom: "8px" }}>
                  <CheckCircle2 size={20} />
                  <strong style={{ fontSize: "14px" }}>Blood Request Registered!</strong>
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#15803d" }}>
                  Your emergency request entry was added to `blood_requests` table. You can now contact this donor:
                </p>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Donor Contact Number</span>
                  <strong style={{ fontSize: "18px", color: "#0f172a", display: "block", margin: "4px 0" }}>{unlockedContact}</strong>
                  <a
                    href={`tel:${unlockedContact.replace(/[^0-9+]/g, "")}`}
                    className="primary"
                    style={{ textDecoration: "none", display: "inline-flex", gap: "6px", background: "#16a34a", padding: "8px 16px", fontSize: "12px", marginTop: "6px" }}
                  >
                    <Phone size={14} /> Call Donor Now
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBloodRequest}>
                {formError && (
                  <div
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      color: "#b91c1c",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      marginBottom: "14px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600",
                    }}
                  >
                    <AlertCircle size={16} color="#e11d48" />
                    <span>{formError}</span>
                  </div>
                )}

                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px", lineHeight: "1.4" }}>
                  In accordance with privacy rules, submitting this form registers a record in `blood_requests` and notifies the donor.
                </p>

                {!targetDonor && (
                  <div className="form-group">
                    <label>Blood Group Required *</label>
                    <select
                      value={requestForm.bloodGroup}
                      onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                    >
                      {bloodBankService.getBloodGroups().map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Hospital / Campus Medical Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Hospital ER / Campus Medical Unit"
                    value={requestForm.hospital}
                    onChange={(e) => setRequestForm({ ...requestForm, hospital: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Units Required *</label>
                    <select
                      required
                      value={requestForm.units}
                      onChange={(e) => setRequestForm({ ...requestForm, units: e.target.value })}
                    >
                      <option value="1 unit">1 unit</option>
                      <option value="2 units">2 units</option>
                      <option value="3+ units">3+ units</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Urgency Level *</label>
                    <select
                      required
                      value={requestForm.urgency}
                      onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High Urgency</option>
                      <option value="critical">CRITICAL (Emergency)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Requester Emergency Contact Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={requestForm.contact}
                    onChange={(e) => setRequestForm({ ...requestForm, contact: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Notes / Patient Details *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide specific medical notes or patient details..."
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="submit"
                    className="btn-request-blood"
                    disabled={submittingRequest}
                  >
                    <Send size={15} /> {submittingRequest ? "Submitting..." : "Confirm & Create Request"}
                  </button>
                  <button
                    type="button"
                    className="btn-contact-outline"
                    onClick={() => { setTargetDonor(null); setIsGeneralRequestModal(false); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}