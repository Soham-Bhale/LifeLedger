export type RoleId = 'opo' | 'logistics' | 'authority' | 'hospital' | 'admin' | 'customer';

export type ServiceAction =
  | 'harvest_organ'
  | 'dispatch_to_logistics'
  | 'log_telemetry'
  | 'handoff_to_authority'
  | 'handoff_to_hospital'
  | 'approve_allocation'
  | 'complete_transplant'
  | 'quarantine_organ'
  | 'manage_investigations'
  | 'inspect_blockchain'
  | 'reset_demo'
  | 'verify_organ'
  | 'scan_qr'
  | 'file_whistleblower_report'
  | 'view_cert'
  | 'view_qr';

export interface RoleServiceDefinition {
  tabNumber: number;
  role: RoleId;
  navLabel: string;
  shortBadge: string;
  badge: string;
  name: string;
  organization: string;
  location: string;
  ethAddress: string;
  stepTag: string;
  judgePitch: string;
  nextStepHint: string;
  allowedActions: ServiceAction[];
}

export interface OrganHistoryHop {
  stage: string;
  from: string;
  fromAddress?: string;
  to: string;
  toAddress?: string;
  roleFrom: string;
  roleTo: string;
  timestamp: string;
  location: string;
  notes: string;
  txHash: string;
  temperatureCelsius?: number;
  verifiedOnChain?: boolean;
}

export interface OrganRecord {
  organId: string;
  batchId?: string;
  organType: string;
  medicineName?: string;
  donorId: string;
  donorBloodType: string;
  dosage?: string;
  hlaMarker: string;
  harvestTimestamp: string;
  ischemicLimitHours: number;
  preservationProtocol: string;
  temperatureCelsius: number;
  recipientId: string;
  recipientHospital: string;
  manufacturerName?: string;
  currentOwner: string;
  currentOwnerName: string;
  currentOwnerRole: string;
  stage: 'Harvested' | 'InTransit' | 'AllocationCleared' | 'HospitalReceived' | 'Transplanted' | 'Quarantined' | string;
  isQuarantined: boolean;
  isRecalled?: boolean;
  recallReason?: string;
  blockchainTxHash?: string;
  blockNumber?: number;
  legalConsentCID?: string;
  donorConsentCertificate?: Record<string, unknown>;
  history: OrganHistoryHop[];
}

const ROLE_ALIASES: Record<string, RoleId> = {
  opo: 'opo',
  manufacturer: 'opo',
  logistics: 'logistics',
  distributor: 'logistics',
  authority: 'authority',
  wholesaler: 'authority',
  hospital: 'hospital',
  pharmacy: 'hospital',
  admin: 'admin',
  regulator: 'admin',
  customer: 'customer',
  public: 'customer',
  verifier: 'customer',
};

export const ROLE_SERVICES: RoleServiceDefinition[] = [
  {
    tabNumber: 1,
    role: 'opo',
    navLabel: '1. OPO Harvest',
    shortBadge: 'OPO Harvest',
    badge: 'Organ Procurement Organization (OPO)',
    name: 'National Organ Procurement Network (Unit 4 Mumbai)',
    organization: 'Lilavati Trauma Surgical Center & OPO',
    location: 'Bandra Reclamation, Mumbai, India',
    ethAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    stepTag: 'Supply Chain Step 1 of 4',
    judgePitch:
      'Verifies Brain-Death Form 8 Consent, registers harvested donor organs on-chain, starts the cold-ischemia countdown, and dispatches to AeroMed Cryo-Logistics.',
    nextStepHint: 'After dispatching an organ to transit, switch to Tab 2 (Cryo-Logistics) to monitor cold-chain transport.',
    allowedActions: ['harvest_organ', 'dispatch_to_logistics', 'view_cert', 'view_qr'],
  },
  {
    tabNumber: 2,
    role: 'logistics',
    navLabel: '2. Cryo-Logistics',
    shortBadge: 'Cryo-Logistics',
    badge: 'Medical Transit & Cryo-Logistics',
    name: 'AeroMed Specialized Organ Logistics',
    organization: 'AeroMed Specialized Medical Air & Ground Logistics',
    location: 'Air Ambulance Terminal 1D, Mumbai / Pune',
    ethAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    stepTag: 'Supply Chain Step 2 of 4',
    judgePitch:
      'Transports organs in hypothermic perfusion containers (2.0°C–4.0°C), records live IoT temperature attestations, and hands off custody to NOTTO Allocation or the Surgical Hospital.',
    nextStepHint: 'After logging telemetry and handing off custody, switch to Tab 3 (Allocation Authority) or Tab 4 (Hospital OR).',
    allowedActions: ['log_telemetry', 'handoff_to_authority', 'handoff_to_hospital', 'view_qr'],
  },
  {
    tabNumber: 3,
    role: 'authority',
    navLabel: '3. Allocation Authority',
    shortBadge: 'NOTTO Allocation',
    badge: 'Regional Organ Allocation Directorate (NOTTO)',
    name: 'Regional Organ Allocation Directorate (NOTTO / SOTTO)',
    organization: 'Regional Healthcare Depot 9, Bangalore',
    location: 'Bangalore, India',
    ethAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    stepTag: 'Supply Chain Step 3 of 4',
    judgePitch:
      'Audits recipient waitlist priority and 6/6 HLA tissue compatibility before issuing cryptographic clearance for surgical reception at the destination hospital.',
    nextStepHint: 'After clearing HLA allocation, switch to Tab 4 (Hospital OR) to complete surgical implantation.',
    allowedActions: ['approve_allocation', 'view_cert', 'view_qr'],
  },
  {
    tabNumber: 4,
    role: 'hospital',
    navLabel: '4. Hospital OR',
    shortBadge: 'Hospital OR',
    badge: 'Transplant Hospital Surgical Suite',
    name: 'Apollo Multi-Specialty Transplant Surgical Center',
    organization: 'Apollo Institute of Renal & Cardiac Transplantation',
    location: 'Jubilee Hills OR Complex, Hyderabad, India',
    ethAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    stepTag: 'Supply Chain Step 4 of 4',
    judgePitch:
      'Receives cleared donor grafts in the operating theater, verifies remaining cold-ischemia window & Form 8 consent, and signs off final surgical implantation.',
    nextStepHint: 'After surgical implantation, switch to Tab 6 (Public Verifier) to inspect the completed end-to-end provenance certificate.',
    allowedActions: ['complete_transplant', 'view_cert', 'view_qr'],
  },
  {
    tabNumber: 5,
    role: 'admin',
    navLabel: '5. Regulator',
    shortBadge: 'Regulatory Admin',
    badge: 'National Regulatory & Anti-Trafficking Authority (NOTTO / UNOS)',
    name: 'National Organ & Tissue Regulatory Authority (NOTTO / UNOS)',
    organization: 'Central Health Ministry & NOTTO Directorate',
    location: 'Central Healthcare Complex, New Delhi',
    ethAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    stepTag: 'Consortium Oversight & Enforcement',
    judgePitch:
      'Monitors all consortium nodes, investigates whistleblower & thermal excursion alerts, executes emergency quarantine freezes, and audits SHA-256 block integrity.',
    nextStepHint: 'Quarantining an organ immediately blocks transfers and surgery across Tabs 1–4 and flags it on Tab 6 (Public Verifier).',
    allowedActions: [
      'quarantine_organ',
      'manage_investigations',
      'inspect_blockchain',
      'reset_demo',
      'view_cert',
      'view_qr',
    ],
  },
  {
    tabNumber: 6,
    role: 'customer',
    navLabel: '6. Public Verifier',
    shortBadge: 'Public Verifier',
    badge: 'Public & Next-of-Kin Authenticity Verifier',
    name: 'Transplant Recipient / Family & Customs Auditor',
    organization: 'National Organ Authenticity Portal',
    location: 'Zero-Wallet Public Access',
    ethAddress: 'Public Read-Only Node (Zero Wallet Required)',
    stepTag: 'Independent Public Audit Service',
    judgePitch:
      'Enables patient families, ethics boards, and airport customs to verify any Organ ID or QR tag, inspect Form 8 consent, or report suspected organ trafficking.',
    nextStepHint: 'Filing an incident report here dispatches a live alert directly to Tab 5 (Regulator).',
    allowedActions: ['verify_organ', 'scan_qr', 'file_whistleblower_report', 'view_cert'],
  },
];

export function normalizeRole(raw?: string | null): RoleId | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  return ROLE_ALIASES[clean] || null;
}

export function resolveActiveRole(searchString: string, sessionRole?: string | null): RoleId {
  const cleanSearch = searchString.startsWith('?') ? searchString.slice(1) : searchString;
  const params = new URLSearchParams(cleanSearch);
  const fromQuery = normalizeRole(params.get('role'));
  if (fromQuery) return fromQuery;

  const fromSession = normalizeRole(sessionRole);
  if (fromSession) return fromSession;

  return 'opo';
}

export function getRoleService(role: RoleId): RoleServiceDefinition {
  return ROLE_SERVICES.find((r) => r.role === role) || ROLE_SERVICES[0];
}

export function canRolePerformAction(role: RoleId, action: ServiceAction): boolean {
  const def = getRoleService(role);
  return def.allowedActions.includes(action);
}

export function getRoleTabUrl(role: RoleId, baseOrigin = ''): string {
  return `${baseOrigin}/?role=${role}`;
}

export function computeColdIschemiaMetrics(
  harvestTimestamp: string,
  ischemicLimitHours: number,
  nowMs: number = Date.now(),
  stage?: string
) {
  const harvestMs = new Date(harvestTimestamp).getTime();
  const limit = Number(ischemicLimitHours) || 24;
  if (isNaN(harvestMs)) {
    return {
      elapsedHours: 0,
      remainingHours: limit,
      limitHours: limit,
      percentRemaining: 100,
      isExpired: false,
      isUrgent: false,
    };
  }

  const elapsedMs = Math.max(0, nowMs - harvestMs);
  const elapsedHours = Number((elapsedMs / (1000 * 3600)).toFixed(1));
  const remainingHours = Number(Math.max(0, limit - elapsedHours).toFixed(1));
  const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingHours / limit) * 100)));
  const isCompleted = stage === 'Transplanted';
  const isExpired = !isCompleted && elapsedHours > limit;
  const isUrgent = !isCompleted && !isExpired && remainingHours <= Math.max(2, limit * 0.25);

  return {
    elapsedHours,
    remainingHours,
    limitHours: limit,
    percentRemaining,
    isExpired,
    isUrgent,
  };
}

export function evaluateThermalSafety(tempCelsius: number) {
  const temp = Number(tempCelsius);
  if (isNaN(temp)) {
    return { temp: 2.8, status: 'OPTIMAL' as const, label: 'Optimal (2.0°C–4.0°C)' };
  }
  if (temp > 6.0) {
    return { temp, status: 'EXCURSION' as const, label: 'Thermal Excursion (>6.0°C)' };
  }
  if (temp > 4.0 || temp < 1.5) {
    return { temp, status: 'DRIFT' as const, label: 'Marginal Drift' };
  }
  return { temp, status: 'OPTIMAL' as const, label: 'Optimal (2.0°C–4.0°C)' };
}

export function partitionOrgansForRole(role: RoleId, organs: OrganRecord[]) {
  const safeOrgans = Array.isArray(organs) ? organs : [];

  if (role === 'opo') {
    const primaryQueue = safeOrgans.filter(
      (o) => !o.isQuarantined && o.stage === 'Harvested' && o.currentOwnerRole === 'opo'
    );
    const secondaryList = safeOrgans.filter(
      (o) => !(o.stage === 'Harvested' && o.currentOwnerRole === 'opo' && !o.isQuarantined)
    );
    return { primaryQueue, secondaryList };
  }

  if (role === 'logistics') {
    const primaryQueue = safeOrgans.filter(
      (o) => !o.isQuarantined && o.stage === 'InTransit' && o.currentOwnerRole === 'logistics'
    );
    const secondaryList = safeOrgans.filter(
      (o) => !(o.stage === 'InTransit' && o.currentOwnerRole === 'logistics' && !o.isQuarantined)
    );
    return { primaryQueue, secondaryList };
  }

  if (role === 'authority') {
    const primaryQueue = safeOrgans.filter(
      (o) =>
        !o.isQuarantined &&
        (o.stage === 'AllocationCleared' || o.stage === 'InTransit') &&
        (o.currentOwnerRole === 'authority' || o.stage === 'InTransit')
    );
    const secondaryList = safeOrgans.filter((o) => !primaryQueue.includes(o));
    return { primaryQueue, secondaryList };
  }

  if (role === 'hospital') {
    const primaryQueue = safeOrgans.filter(
      (o) =>
        !o.isQuarantined &&
        (o.stage === 'HospitalReceived' || (o.stage === 'AllocationCleared' && o.currentOwnerRole === 'hospital'))
    );
    const secondaryList = safeOrgans.filter((o) => !primaryQueue.includes(o));
    return { primaryQueue, secondaryList };
  }

  // admin or customer
  const primaryQueue = safeOrgans.filter((o) => !o.isQuarantined && o.stage !== 'Transplanted');
  const secondaryList = safeOrgans.filter((o) => o.isQuarantined || o.stage === 'Transplanted');
  return { primaryQueue, secondaryList };
}
