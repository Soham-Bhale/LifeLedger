const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial state for LifeLedger Organ Procurement Network
const getInitialState = () => {
  const salt = bcrypt.genSaltSync(10);
  return {
    users: [
      {
        id: "usr_admin",
        name: "National Organ & Tissue Regulatory Authority (NOTTO / UNOS)",
        email: "admin@lifeledger.org",
        passwordHash: bcrypt.hashSync("admin123", salt),
        role: "admin",
        organization: "Central Health Ministry & NOTTO Directorate",
        location: "Central Healthcare Complex, New Delhi",
        ethAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        isApproved: true,
        badge: "National Regulatory Admin",
        headline: "National Allocation Oversight, Anti-Trafficking Registry & Compliance Enforcement",
        createdAt: "2026-01-01T00:00:00Z"
      },
      {
        id: "usr_opo",
        name: "National Organ Procurement Network (Unit 4 Mumbai)",
        email: "opo@lifeledger.org",
        passwordHash: bcrypt.hashSync("opo123", salt),
        role: "opo",
        organization: "Lilavati Memorial Surgical Trauma Center & OPO",
        location: "Bandra Reclamation, Mumbai, India",
        ethAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        isApproved: true,
        licenseNumber: "OPO-2026-WZ-401",
        badge: "Organ Procurement Org (OPO)",
        headline: "Donor Consent Verification, Organ Retrieval & Cryo-Genesis Release",
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: "usr_logistics",
        name: "AeroMed Specialized Organ Logistics & Cryo-Transit",
        email: "logistics@aeromed.org",
        passwordHash: bcrypt.hashSync("dist123", salt),
        role: "logistics",
        organization: "AeroMed Specialized Medical Air & Ground Logistics",
        location: "Air Ambulance Terminal 1D, Mumbai / Pune, India",
        ethAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        isApproved: true,
        licenseNumber: "MED-AIR-2026-904",
        badge: "Medical Transit Logistics",
        headline: "Refrigerated Cryo-Carrier Fleet, Real-Time Cold Ischemia Telemetry & Transport",
        createdAt: "2026-01-10T00:00:00Z"
      },
      {
        id: "usr_authority",
        name: "Regional Organ Allocation Directorate (NOTTO / SOTTO)",
        email: "allocation@notto.gov.in",
        passwordHash: bcrypt.hashSync("whole123", salt),
        role: "authority",
        organization: "Regional Medical Allocation Directorate",
        location: "Regional Healthcare Depot 9, Bangalore, India",
        ethAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        isApproved: true,
        licenseNumber: "NOTTO-ALLOC-REG-08",
        badge: "Allocation Authority",
        headline: "Recipient Queue Prioritization, HLA Compatibility Clearance & Custody Audit",
        createdAt: "2026-01-15T00:00:00Z"
      },
      {
        id: "usr_hospital",
        name: "Apollo Multi-Specialty Transplant Surgical Center",
        email: "transplant@apollo.org",
        passwordHash: bcrypt.hashSync("pharm123", salt),
        role: "hospital",
        organization: "Apollo Institute of Renal & Cardiac Transplantation",
        location: "Jubilee Hills OR Complex, Hyderabad, India",
        ethAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        isApproved: true,
        licenseNumber: "TX-HOSP-HYD-882",
        badge: "Transplant Hospital / Surgical Suite",
        headline: "Recipient Crossmatch Verification, Pre-Op Inspection & Surgical Implantation",
        createdAt: "2026-01-20T00:00:00Z"
      }
    ],
    organs: [],
    batches: [],
    verifications: [],
    reports: []
  };
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialState();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data.organs) data.organs = data.batches || [];
    if (!data.reports) data.reports = [];
    return data;
  } catch (err) {
    console.error("Error reading db.json, re-initializing:", err);
    const initial = getInitialState();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Reset db to clean LifeLedger organ state
function resetToLifeLedger() {
  const initial = getInitialState();
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

module.exports = {
  resetToLifeLedger,

  // Users
  getUsers: () => readDb().users,
  getUserById: (id) => {
    const users = readDb().users;
    return users.find(u => u.id === id);
  },
  getUserByEmail: (email) => {
    const users = readDb().users;
    return users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  },
  getUserByRole: (role) => {
    const users = readDb().users;
    return users.find(u => u.role.toLowerCase() === (role || '').toLowerCase());
  },

  // Organs
  getOrgans: () => {
    const db = readDb();
    return db.organs || db.batches || [];
  },
  getOrganById: (id) => {
    const organs = readDb().organs || readDb().batches || [];
    const idUpper = (id || '').toUpperCase();
    return organs.find(o => (o.organId || o.batchId || '').toUpperCase() === idUpper);
  },
  // Backward compatibility alias for batches
  getBatches: () => {
    const db = readDb();
    return db.organs || db.batches || [];
  },
  getBatchById: (id) => {
    const organs = readDb().organs || readDb().batches || [];
    const idUpper = (id || '').toUpperCase();
    return organs.find(o => (o.organId || o.batchId || '').toUpperCase() === idUpper);
  },
  saveOrgan: (organData) => {
    const db = readDb();
    if (!db.organs) db.organs = [];
    const id = organData.organId || organData.batchId;
    const existingIdx = db.organs.findIndex(o => (o.organId || o.batchId) === id);
    if (existingIdx >= 0) {
      db.organs[existingIdx] = { ...db.organs[existingIdx], ...organData };
    } else {
      db.organs.unshift(organData);
    }
    db.batches = db.organs; // mirror for any legacy route
    writeDb(db);
    return organData;
  },
  saveBatch: (organData) => {
    const db = readDb();
    if (!db.organs) db.organs = [];
    const id = organData.organId || organData.batchId;
    const existingIdx = db.organs.findIndex(o => (o.organId || o.batchId) === id);
    if (existingIdx >= 0) {
      db.organs[existingIdx] = { ...db.organs[existingIdx], ...organData };
    } else {
      db.organs.unshift(organData);
    }
    db.batches = db.organs;
    writeDb(db);
    return organData;
  },
  updateOrgan: (id, updates) => {
    const db = readDb();
    const idUpper = (id || '').toUpperCase();
    const organ = (db.organs || []).find(o => (o.organId || o.batchId || '').toUpperCase() === idUpper);
    if (!organ) return null;
    Object.assign(organ, updates);
    writeDb(db);
    return organ;
  },

  // Verifications
  getVerifications: () => readDb().verifications || [],
  recordVerification: (record) => {
    const db = readDb();
    if (!db.verifications) db.verifications = [];
    db.verifications.unshift({
      id: "scan_" + Date.now(),
      timestamp: new Date().toISOString(),
      ...record
    });
    writeDb(db);
  },

  // Regulatory Alerts & Investigations
  getReports: () => readDb().reports || [],
  addReport: (reportData) => {
    const db = readDb();
    if (!db.reports) db.reports = [];
    const newReport = {
      id: `ALERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "INVESTIGATION_DISPATCHED",
      filedAt: new Date().toISOString(),
      ...reportData
    };
    db.reports.unshift(newReport);
    writeDb(db);
    return newReport;
  },
  updateReportStatus: (id, status) => {
    const db = readDb();
    const rep = (db.reports || []).find(r => r.id === id);
    if (!rep) return null;
    rep.status = status;
    rep.updatedAt = new Date().toISOString();
    writeDb(db);
    return rep;
  }
};
