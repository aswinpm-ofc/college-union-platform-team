import { apiRequest } from "./http";
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/constants";
import { getAuthHeaders, supabase } from "../../lib/supabaseClient";

let DEMO_BLOOD_DONORS = [
  {
    id: "donor-001",
    name: "Aditya Verma",
    bloodGroup: "O+",
    department: "Computer Science (S5)",
    contact: "+91 98765 43210",
    email: "aditya.cs@college.edu",
    verified: true,
    lastDonation: "2026-04-10", // >90 days ago (eligible)
    campus: true,
  },
  {
    id: "donor-002",
    name: "Sneha Nair",
    bloodGroup: "A+",
    department: "Electronics & Comm (S7)",
    contact: "+91 87654 32109",
    email: "sneha.ec@college.edu",
    verified: true,
    lastDonation: "2026-08-01", // ~34 days ago (in cooldown)
    campus: true,
  },
  {
    id: "donor-003",
    name: "Rahul Krishnan",
    bloodGroup: "B+",
    department: "Mechanical Eng (S3)",
    contact: "+91 91234 56789",
    email: "rahul.me@college.edu",
    verified: true,
    lastDonation: "2026-01-15", // eligible
    campus: false,
  },
  {
    id: "donor-004",
    name: "Ananya Sharma",
    bloodGroup: "O-",
    department: "Civil Eng (S5)",
    contact: "+91 99887 76655",
    email: "ananya.ce@college.edu",
    verified: true,
    lastDonation: null, // Never donated (eligible)
    campus: true,
  },
  {
    id: "donor-005",
    name: "Fahad Ibrahim",
    bloodGroup: "AB+",
    department: "Computer Science (S7)",
    contact: "+91 95432 10987",
    email: "fahad.cs@college.edu",
    verified: false,
    lastDonation: "2026-05-12", // eligible
    campus: true,
  },
  {
    id: "donor-006",
    name: "Meera Rajesh",
    bloodGroup: "A-",
    department: "Electronics & Comm (S3)",
    contact: "+91 97865 12340",
    email: "meera.ec@college.edu",
    verified: true,
    lastDonation: "2026-07-20", // in cooldown
    campus: true,
  },
  {
    id: "donor-007",
    name: "Karthik Menon",
    bloodGroup: "B-",
    department: "Mechanical Eng (S5)",
    contact: "+91 93210 98765",
    email: "karthik.me@college.edu",
    verified: true,
    lastDonation: "2025-11-10",
    campus: false,
  },
  {
    id: "donor-008",
    name: "Pooja Hegde",
    bloodGroup: "AB-",
    department: "Civil Eng (S7)",
    contact: "+91 91098 76543",
    email: "pooja.ce@college.edu",
    verified: true,
    lastDonation: "2026-02-28", // eligible
    campus: true,
  },
];

const DEMO_BLOOD_REQUESTS = [
  {
    id: "req-001",
    bloodGroup: "B+",
    quantity: "2 units",
    urgency: "high",
    requester: "Dr. Roy / ICU Dept",
    hospital: "City Medical Center, Block B",
    createdAt: "2026-09-02",
    requiredBy: "2026-09-05",
    contact: "+91 94470 12345",
    status: "searching",
    notes: "Urgent surgery requirement. B+ blood donors needed.",
  },
  {
    id: "req-002",
    bloodGroup: "O-",
    quantity: "1 unit",
    urgency: "critical",
    requester: "Student Welfare Desk",
    hospital: "General Hospital, Emergency Room 4",
    createdAt: "2026-09-04",
    requiredBy: "2026-09-04",
    contact: "+91 98460 99887",
    status: "searching",
    notes: "Universal donor O negative required immediately for emergency transfusion.",
  },
];

const CAMPUS_HELPLINES = [
  {
    id: "help-1",
    title: "Campus Medical Center",
    phone: "+91 94470 00999",
    description: "24/7 Campus Health Center & Emergency Response",
    icon: "PhoneCall",
  },
  {
    id: "help-2",
    title: "Union Welfare Coordinator",
    phone: "+91 98460 11223",
    description: "Student Union Blood Donation Helpline",
    icon: "ShieldAlert",
  },
  {
    id: "help-3",
    title: "Campus Ambulance Desk",
    phone: "108 / +91 91234 00000",
    description: "Emergency Medical Transport",
    icon: "Ambulance",
  },
];

export const bloodBankService = {
  // Helper to calculate eligibility based on 90-day donation interval
  calculateEligibility(lastDonationDateStr) {
    if (!lastDonationDateStr) {
      return { isEligible: true, daysRemaining: 0, daysAgo: null, label: "Ready to Donate (First Time)" };
    }
    const lastDate = new Date(lastDonationDateStr);
    const today = new Date();
    const diffTime = today - lastDate;
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const COOLDOWN_DAYS = 90;
    if (daysAgo >= COOLDOWN_DAYS) {
      return { isEligible: true, daysRemaining: 0, daysAgo, label: `Eligible (${daysAgo} days since last donation)` };
    } else {
      const daysRemaining = COOLDOWN_DAYS - daysAgo;
      return { isEligible: false, daysRemaining, daysAgo, label: `Cooldown: Eligible in ${daysRemaining} days` };
    }
  },

  async getDonors(filters = {}) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && filters.bloodGroup && filters.bloodGroup !== "ALL") {
      const { data, error } = await supabase.rpc("find_compatible_donors", { requested_blood_group: filters.bloodGroup });
      if (error) return { ok: false, error: error.message, data: [] };
      let donors = (data || []).map((donor) => ({
        id: donor.id,
        name: donor.full_name,
        bloodGroup: donor.blood_group,
        contact: donor.phone || donor.email || "Contact unavailable",
        email: donor.email,
        department: "Campus Student",
        lastDonation: donor.last_donation_date,
        verified: true,
        campus: true,
      }));
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        donors = donors.filter((donor) => `${donor.name} ${donor.bloodGroup} ${donor.department}`.toLowerCase().includes(query));
      }
      return { ok: true, data: donors };
    }
    if (SUPABASE_URL && SUPABASE_ANON_KEY && (!filters.bloodGroup || filters.bloodGroup === "ALL")) {
      return { ok: true, data: [] };
    }
    if (DEMO_MODE) {
      let filtered = [...DEMO_BLOOD_DONORS];

      if (filters.bloodGroup && filters.bloodGroup !== "ALL") {
        filtered = filtered.filter((donor) => donor.bloodGroup === filters.bloodGroup);
      }

      if (filters.campusOnly) {
        filtered = filtered.filter((donor) => donor.campus === true);
      }

      if (filters.eligibleOnly) {
        filtered = filtered.filter((donor) => {
          const { isEligible } = this.calculateEligibility(donor.lastDonation);
          return isEligible;
        });
      }

      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (donor) =>
            donor.name.toLowerCase().includes(query) ||
            donor.bloodGroup.toLowerCase().includes(query) ||
            (donor.department && donor.department.toLowerCase().includes(query))
        );
      }

      return { ok: true, data: filtered };
    }
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/blood-bank/donors?${params}`, { method: "GET" });
  },

  async getRequests() {
    if (supabase) {
      const { data, error } = await supabase.from("blood_requests").select("*").order("created_at", { ascending: false });
      return error ? { ok: false, error: error.message, data: [] } : { ok: true, data: (data || []).map((request) => ({ ...request, bloodGroup: request.blood_group, quantity: `${request.units || 1} unit(s)`, hospital: request.location, contact: request.contact_phone, createdAt: request.created_at })) };
    }
    if (DEMO_MODE) {
      return { ok: true, data: DEMO_BLOOD_REQUESTS };
    }
    return apiRequest("/api/blood-bank/requests", { method: "GET" });
  },

  async updateRequestStatus(requestId, status) {
    if (DEMO_MODE) {
      const req = DEMO_BLOOD_REQUESTS.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
      }
      return { ok: true, data: req };
    }
    return apiRequest(`/api/blood-bank/requests/${requestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async getHelplines() {
    return { ok: true, data: CAMPUS_HELPLINES };
  },

  async createRequest(requestData) {
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return { ok: false, error: "Please sign in before creating a blood request." };
      const { data, error } = await supabase.from("blood_requests").insert({
        requester_id: authData.user.id,
        blood_group: requestData.bloodGroup,
        units: Number.parseInt(requestData.units, 10) || 1,
        urgency: requestData.urgency || "open",
        location: requestData.hospital,
        contact_phone: requestData.contact,
        notes: requestData.notes,
        status: "open",
      }).select("*").single();
      return error ? { ok: false, error: error.message } : { ok: true, data };
    }
    if (DEMO_MODE) {
      const newReq = {
        id: `req-${Date.now()}`,
        ...requestData,
        status: "searching",
        createdAt: new Date().toISOString().split("T")[0],
      };
      DEMO_BLOOD_REQUESTS.unshift(newReq);
      return { ok: true, data: newReq };
    }
    return apiRequest("/api/blood-bank/requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  },

  async registerAsDonor(donorData) {
    if (DEMO_MODE) {
      const newDonor = {
        id: `donor-${Date.now()}`,
        ...donorData,
        lastDonation: donorData.lastDonation || null,
        verified: true,
        campus: donorData.campus ?? true,
      };
      DEMO_BLOOD_DONORS.unshift(newDonor);
      return { ok: true, data: newDonor };
    }
    return apiRequest("/api/blood-bank/donors/register", {
      method: "POST",
      body: JSON.stringify(donorData),
    });
  },

  async updateLastDonationDate(dateString) {
    if (DEMO_MODE) {
      const currentUserIndex = DEMO_BLOOD_DONORS.findIndex((d) => d.id === "donor-current-user");
      if (currentUserIndex >= 0) {
        DEMO_BLOOD_DONORS[currentUserIndex].lastDonation = dateString;
      } else {
        DEMO_BLOOD_DONORS.unshift({
          id: "donor-current-user",
          name: "You (Student)",
          bloodGroup: "O+",
          department: "Computer Science",
          contact: "+91 99999 00000",
          verified: true,
          lastDonation: dateString,
          campus: true,
        });
      }
      return { ok: true, lastDonation: dateString };
    }
    return apiRequest("/api/blood-bank/donors/last-donation", {
      method: "PATCH",
      body: JSON.stringify({ lastDonation: dateString }),
    });
  },

  getBloodGroups() {
    return ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  },

  getUrgencyLevels() {
    return ["low", "normal", "high", "critical"];
  },
};


