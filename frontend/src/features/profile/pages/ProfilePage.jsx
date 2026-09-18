import React, { useEffect, useState } from "react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { profileService } from "../../../services/api/profileService";
import { academicsService } from "../../../services/api/academicsService";

const SEMESTER_OPTIONS = [1, 3, 5, 7];

export default function Profile({ role, user, onLogout }) {
  const currentUser = user || { id: "demo-user", name: "Aswin P.", initials: "AP", email: "student@college.local" };

  const [profile, setProfile] = useState({
    fullName: currentUser.name || "Aswin P.",
    email: currentUser.email || "student@college.local",
    studentId: "",
    departmentId: "",
    semester: SEMESTER_OPTIONS[2],
    phone: "",
    willingToDonate: false,
    bloodGroup: "",
    lastDonationDate: "",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const roleLabel = role === "student" ? "Student" : role === "maintainer" ? "Academic Maintainer" : "Super Admin";

  useEffect(() => {
    let cancelled = false;

    academicsService.getApprovedDepartments().then((res) => {
      if (!cancelled && res?.ok && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    });

    profileService.getMyProfile(currentUser.id).then((profileRes) => {
      if (cancelled) return;

      setProfile((prev) => {
        const p = profileRes?.data || {};
        return {
          fullName: p.full_name || prev.fullName,
          email: p.email || currentUser.email || prev.email,
          studentId: p.student_id || "",
          departmentId: p.department_id || "",
          semester: p.semester || prev.semester,
          phone: p.phone || "",
          willingToDonate: Boolean(p.willing_to_donate),
          bloodGroup: p.blood_group || "",
          lastDonationDate: p.last_donation_date || "",
        };
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const profileRes = await profileService.updateMyProfile(currentUser.id, {
        full_name: profile.fullName,
        student_id: profile.studentId || null,
        department_id: profile.departmentId || null,
        semester: profile.semester,
        phone: profile.phone || null,
        willing_to_donate: profile.willingToDonate,
        blood_group: profile.bloodGroup || null,
        last_donation_date: profile.lastDonationDate || null,
      });

    setSaving(false);

    if (!profileRes.ok) {
      setError(profileRes.error || "Couldn't save your changes. Please try again.");
      setSaved(false);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const departmentName = departments.find((d) => d.id === profile.departmentId)?.name || "";

  return (
    <>
      <PageHead eyebrow="ACCOUNT" title="Profile" desc="Manage your account details and preferences." />

      <Card className="profile-card">
        <div className="big-avatar">{currentUser.initials || "AP"}</div>
        <div>
          <span className="eyebrow">{roleLabel.toUpperCase()} PROFILE</span>
          <h2>{profile.fullName}</h2>
          <p>
            {departmentName || "No department set"} · Semester {profile.semester} · ID {profile.studentId || "Not set"}
          </p>
          <div className="profile-pills">
            <span className="pill">{roleLabel}</span>
            <span className="pill">Active</span>
          </div>
        </div>
      </Card>

      <div className="settings-grid">
        <Card>
          <h3>Account information</h3>

          {error && <div className="form-error">{error}</div>}

          <label>
            Full name
            <input value={profile.fullName} onChange={(e) => handleFieldChange("fullName", e.target.value)} disabled={loading} />
          </label>
          <label>
            Email
            <input value={profile.email} disabled readOnly />
          </label>
          <p className="hint">Email is tied to your sign-in and can't be changed here.</p>
          <label>
            Student ID
            <input value={profile.studentId} onChange={(e) => handleFieldChange("studentId", e.target.value)} disabled={loading} />
          </label>
          <label>
            Department
            <select value={profile.departmentId} onChange={(e) => handleFieldChange("departmentId", e.target.value)} disabled={loading}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Semester
            <select value={profile.semester} onChange={(e) => handleFieldChange("semester", Number(e.target.value))} disabled={loading}>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Phone
            <input value={profile.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} disabled={loading} />
          </label>
          <label className="toggle">
            <span>Are you willing to donate blood?</span>
            <input type="checkbox" checked={profile.willingToDonate} onChange={(e) => handleFieldChange("willingToDonate", e.target.checked)} disabled={loading} />
          </label>
          {profile.willingToDonate && <>
            <label>
              Blood group
              <select value={profile.bloodGroup} onChange={(e) => handleFieldChange("bloodGroup", e.target.value)} disabled={loading} required>
                <option value="">Select blood group</option>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </label>
            <label>
              Last donated
              <input type="date" value={profile.lastDonationDate} onChange={(e) => handleFieldChange("lastDonationDate", e.target.value)} disabled={loading} />
            </label>
          </>}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button type="button" className="primary" onClick={handleSave} disabled={loading || saving}>
              {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
            </button>
            <button type="button" className="outline" onClick={onLogout}>
              Log out
            </button>
          </div>
        </Card>

      </div>
    </>
  );
}
