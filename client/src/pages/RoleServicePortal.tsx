import React, { useState } from 'react';
import {
  Plus,
  Truck,
  QrCode,
  ShieldAlert,
  HeartHandshake,
  RefreshCw,
  Building2,
  Award,
  Thermometer,
  Clock,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  partitionOrgansForRole,
  computeColdIschemiaMetrics,
  evaluateThermalSafety,
  type OrganRecord,
  type RoleId,
} from '../utils/roleWorkflow';
import CreateBatchModal from '../components/CreateBatchModal';
import QRCodeModal from '../components/QRCodeModal';
import CertificateModal from '../components/CertificateModal';
import VerifyPage from './VerifyPage';
import ExplorerPage from './ExplorerPage';
import BlockVisualizerPage from './BlockVisualizerPage';

const LOGISTICS_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const AUTHORITY_ADDRESS = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const HOSPITAL_ADDRESS = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';

export default function RoleServicePortal() {
  const {
    currentUser,
    switchRole,
    demoUsers,
    organs,
    investigations,
    loading,
    lastSyncedAt,
    broadcastSync,
  } = useAuth();

  const [isHarvestOpen, setIsHarvestOpen] = useState(false);
  const [qrTargetOrgan, setQrTargetOrgan] = useState<OrganRecord | null>(null);
  const [certTargetOrgan, setCertTargetOrgan] = useState<OrganRecord | null>(null);
  const [busyOrganId, setBusyOrganId] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    nextRole?: RoleId;
    nextLabel?: string;
  } | null>(null);

  // Admin-only segmented view
  const [adminSubTab, setAdminSubTab] = useState<'oversight' | 'validators' | 'blockchain'>('oversight');

  const { primaryQueue, secondaryList } = partitionOrgansForRole(currentUser.role, organs);

  // ── Role 1 (OPO) Exclusive Action: Dispatch Harvested Organ to Cryo-Logistics ──
  const handleOpoDispatchToLogistics = async (organ: OrganRecord) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/organs/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'opo' },
        body: JSON.stringify({
          toAddress: LOGISTICS_ADDRESS,
          location: 'Air Ambulance Terminal 1D, Mumbai',
          currentTemp: organ.temperatureCelsius || 2.8,
          notes: 'OPO sealed cryo-container and handed off custody to AeroMed Cryo-Logistics.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `${id} (${organ.organType}) dispatched to AeroMed Cryo-Logistics. Tab 2 (?role=logistics) is now updated live.`,
        nextRole: 'logistics',
        nextLabel: 'Switch to Tab 2: Cryo-Logistics',
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to dispatch organ',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  // ── Role 2 (Logistics) Exclusive Actions: Log Telemetry & Handoff Custody ──
  const handleLogisticsTelemetry = async (organ: OrganRecord, tempCelsius: number) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/organs/${id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'logistics' },
        body: JSON.stringify({
          temperatureCelsius: tempCelsius,
          location: 'Green-Corridor Air Ambulance Flight MED-901',
          notes:
            tempCelsius > 6.0
              ? `ALERT: Cryo-sensor excursion (${tempCelsius}°C) recorded in transit.`
              : `Routine hypothermic perfusion check: ${tempCelsius}°C (Optimal 2.0°C–4.0°C).`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Telemetry ping failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `Logged ${tempCelsius}°C container telemetry on-chain for ${id}.`,
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Telemetry update failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  const handleLogisticsHandoff = async (
    organ: OrganRecord,
    target: 'authority' | 'hospital'
  ) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const toAddress = target === 'authority' ? AUTHORITY_ADDRESS : HOSPITAL_ADDRESS;
      const location =
        target === 'authority'
          ? 'NOTTO Regional Allocation Clearinghouse, Bangalore'
          : 'Apollo Transplant Surgical Suite OR #4, Hyderabad';
      const notes =
        target === 'authority'
          ? 'Cryo-carrier arrived at regional clearinghouse for final NOTTO HLA-match sign-off.'
          : 'Cryo-carrier delivered directly to Apollo Surgical Receiving Dock.';

      const res = await fetch(`/api/organs/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'logistics' },
        body: JSON.stringify({
          toAddress,
          location,
          currentTemp: organ.temperatureCelsius || 2.8,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Handoff failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message:
          target === 'authority'
            ? `${id} handed off to NOTTO Allocation Authority. Tab 3 (?role=authority) is updated live.`
            : `${id} delivered to Apollo Transplant Hospital OR. Tab 4 (?role=hospital) is updated live.`,
        nextRole: target,
        nextLabel:
          target === 'authority'
            ? 'Switch to Tab 3: Allocation Authority'
            : 'Switch to Tab 4: Hospital OR',
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Handoff failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  // ── Role 3 (Authority) Exclusive Action: Approve HLA Match & Dispatch to OR ──
  const handleAuthorityApproveAllocation = async (organ: OrganRecord) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/organs/${id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'authority' },
        body: JSON.stringify({
          recipientId: organ.recipientId || 'RCP-7704',
          recipientHospital: organ.recipientHospital || 'Apollo Multi-Specialty Transplant Surgical Center',
          notes: `NOTTO Waitlist & ${organ.hlaMarker} compatibility verified. Cleared for immediate OR implantation.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Allocation clearance failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `HLA Allocation cleared for ${id}. Organ routed to Apollo Hospital OR (Tab 4: ?role=hospital).`,
        nextRole: 'hospital',
        nextLabel: 'Switch to Tab 4: Hospital OR',
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Allocation clearance failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  // ── Role 4 (Hospital) Exclusive Action: Complete Surgical Implantation ──
  const handleHospitalCompleteTransplant = async (organ: OrganRecord) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/organs/${id}/transplant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'hospital' },
        body: JSON.stringify({
          notes: `Surgical anastomosis & reperfusion verified in Apollo OR for Recipient ${organ.recipientId}. Cold-ischemia window respected.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Surgical sign-off failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `Surgical implantation completed for ${id}! Full provenance is now verifiable on Tab 6 (?role=customer).`,
        nextRole: 'customer',
        nextLabel: 'Switch to Tab 6: Public Verifier',
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Surgical sign-off failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  // ── Role 5 (Admin / Regulator) Exclusive Actions: Quarantine, Investigations, Reset ──
  const handleAdminQuarantine = async (organ: OrganRecord) => {
    const id = organ.organId || organ.batchId || '';
    setBusyOrganId(id);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/organs/${id}/quarantine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'admin' },
        body: JSON.stringify({
          reason: 'NOTTO Regulatory Hold: Cold-chain excursion or custody compliance audit triggered.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quarantine failed');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `EMERGENCY QUARANTINE ISSUED on ${id}. All transfers and surgical sign-offs are now locked across Tabs 1–4.`,
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Quarantine failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  const handleAdminUpdateInvestigation = async (reportId: string, status: string) => {
    try {
      await fetch(`/api/stats/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: `Investigation Case ${reportId} updated to ${status}.`,
      });
    } catch {
      // ignore
    }
  };

  const handleResetDemoData = async () => {
    setBusyOrganId('RESET');
    setActionBanner(null);
    try {
      const res = await fetch('/api/organs/reset-demo', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset demo data');
      broadcastSync();
      setActionBanner({
        type: 'success',
        message: 'Demo dataset restored to initial 6-organ state across all 6 tabs.',
      });
    } catch (err: unknown) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Reset failed',
      });
    } finally {
      setBusyOrganId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Judge-Friendly Isolated Service Header ── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-blue-700">
                Tab {currentUser.tabNumber} of 6 (/?role={currentUser.role})
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{currentUser.stepTag}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">{currentUser.location}</span>
            </div>

            <h1
              className="text-2xl font-extrabold text-slate-900 tracking-tight font-display"
              style={{ textWrap: 'balance' }}
            >
              {currentUser.badge}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">{currentUser.judgePitch}</p>
          </div>

          {/* Right side: Role-specific primary action or live sync status */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {currentUser.role === 'opo' && (
              <button
                type="button"
                onClick={() => setIsHarvestOpen(true)}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Register & Harvest Donor Organ</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={busyOrganId === 'RESET'}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busyOrganId === 'RESET' ? 'animate-spin' : ''}`} />
                <span>Reset Demo Seed Data</span>
              </button>
            )}

            <button
              type="button"
              onClick={broadcastSync}
              aria-label="Sync Ledger Now"
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-mono tabular-nums">Synced {lastSyncedAt}</span>
            </button>
          </div>
        </div>

        {/* 6-Tab Architecture Pipeline Strip (Shows judges where this tab sits in the 6-tab flow) */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">6-Tab Flow:</span>
            {demoUsers.map((s, index) => {
              const isCurrent = s.role === currentUser.role;
              return (
                <React.Fragment key={s.role}>
                  <button
                    type="button"
                    onClick={() => switchRole(s.role)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {s.tabNumber}. {s.shortBadge}
                  </button>
                  {index < demoUsers.length - 1 && (
                    <span aria-hidden="true" className="text-slate-300">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <a
            href={`/?role=${currentUser.role}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Pop Out This Role Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* ── Action Confirmation Banner (with 1-click jump to the next role tab for live demos) ── */}
      {actionBanner && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            actionBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                actionBanner.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span className="font-medium">{actionBanner.message}</span>
          </div>
          {actionBanner.nextRole && (
            <button
              type="button"
              onClick={() => {
                const targetRole = actionBanner.nextRole!;
                setActionBanner(null);
                switchRole(targetRole);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{actionBanner.nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: PUBLIC & FAMILY VERIFIER PORTAL (?role=customer)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'customer' && <VerifyPage />}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OPO HARVEST & PROCUREMENT PORTAL (?role=opo)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'opo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  OPO Active Procurement Queue — Ready for Cold-Chain Dispatch ({primaryQueue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organs harvested at Lilavati Trauma OPO awaiting handoff to AeroMed Cryo-Logistics (Tab 2)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Signer: {currentUser.ethAddress.slice(0, 10)}...
              </span>
            </div>

            {primaryQueue.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  All harvested organs have been dispatched to Cryo-Logistics.
                </p>
                <p className="text-xs text-slate-500">
                  Click below to register a new donor organ harvest or switch to Tab 2 (Cryo-Logistics) to continue the handoff.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsHarvestOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Register & Harvest Donor Organ
                  </button>
                  <button
                    type="button"
                    onClick={() => switchRole('logistics')}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Go to Tab 2: Cryo-Logistics →
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="px-5 py-3">Organ ID & Graft</th>
                      <th className="px-5 py-3">Donor & HLA Match</th>
                      <th className="px-5 py-3">Cold-Ischemia Timer</th>
                      <th className="px-5 py-3">Target Recipient</th>
                      <th className="px-5 py-3 text-right">OPO Service Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {primaryQueue.map((organ) => {
                      const id = organ.organId || organ.batchId || '';
                      const metrics = computeColdIschemiaMetrics(
                        organ.harvestTimestamp,
                        organ.ischemicLimitHours,
                        Date.now(),
                        organ.stage
                      );
                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-slate-900 text-sm">{id}</div>
                            <div className="text-slate-600 mt-0.5">{organ.organType}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-slate-900">
                              Blood {organ.donorBloodType} · {organ.donorId}
                            </div>
                            <div className="text-slate-500 mt-0.5">{organ.hlaMarker}</div>
                          </td>
                          <td className="px-5 py-4 font-mono tabular-nums">
                            <div className="font-bold text-slate-900">
                              {metrics.remainingHours}h remaining (Limit {metrics.limitHours}h)
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              Perfusion Temp: {organ.temperatureCelsius}°C
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono font-semibold text-slate-900">{organ.recipientId}</div>
                            <div className="text-slate-500 truncate max-w-[200px] mt-0.5">
                              {organ.recipientHospital}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setCertTargetOrgan(organ)}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Form 8 Consent
                              </button>
                              <button
                                type="button"
                                onClick={() => setQrTargetOrgan(organ)}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                QR Tag
                              </button>
                              <button
                                type="button"
                                disabled={busyOrganId === id}
                                onClick={() => handleOpoDispatchToLogistics(organ)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>
                                  {busyOrganId === id ? 'Dispatching...' : 'Dispatch to Cryo-Logistics'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dispatched Downstream Reference Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 font-display">
                Previously Procured Organs (Now in Downstream Custody)
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {secondaryList.length} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-5 py-2.5">Organ ID</th>
                    <th className="px-5 py-2.5">Organ Type</th>
                    <th className="px-5 py-2.5">Current Custodian Node</th>
                    <th className="px-5 py-2.5">Current Stage</th>
                    <th className="px-5 py-2.5 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {secondaryList.map((organ) => {
                    const id = organ.organId || organ.batchId || '';
                    return (
                      <tr key={id} className="text-slate-600">
                        <td className="px-5 py-3 font-mono font-semibold text-slate-900">{id}</td>
                        <td className="px-5 py-3">{organ.organType}</td>
                        <td className="px-5 py-3">{organ.currentOwnerName}</td>
                        <td className="px-5 py-3 font-mono font-semibold">{organ.stage}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setCertTargetOrgan(organ)}
                            className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                          >
                            View Form 8
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: CRYO-LOGISTICS TRANSIT PORTAL (?role=logistics)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'logistics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Active Cold-Chain Air-Ambulance Shipments ({primaryQueue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organs currently in AeroMed custody · Maintain 2.0°C–4.0°C and hand off to NOTTO Allocation (Tab 3) or Hospital OR (Tab 4)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Carrier Key: {currentUser.ethAddress.slice(0, 10)}...
              </span>
            </div>

            {primaryQueue.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  No active cryo-containers currently in AeroMed transit custody.
                </p>
                <p className="text-xs text-slate-500">
                  Dispatch an organ from Tab 1 (OPO Harvest) to see it appear here immediately.
                </p>
                <button
                  type="button"
                  onClick={() => switchRole('opo')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ← Switch to Tab 1: OPO Harvest
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {primaryQueue.map((organ) => {
                  const id = organ.organId || organ.batchId || '';
                  const metrics = computeColdIschemiaMetrics(
                    organ.harvestTimestamp,
                    organ.ischemicLimitHours,
                    Date.now(),
                    organ.stage
                  );
                  const thermal = evaluateThermalSafety(organ.temperatureCelsius);

                  return (
                    <div key={id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900 text-base">{id}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-800">{organ.organType}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono font-bold text-rose-700">Blood {organ.donorBloodType}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-500">Destination: {organ.recipientHospital}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-xs font-mono tabular-nums">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="w-4 h-4 text-blue-600" />
                            <span>Container Temp:</span>
                            <strong
                              className={
                                thermal.status === 'EXCURSION' ? 'text-rose-700' : 'text-emerald-700'
                              }
                            >
                              {organ.temperatureCelsius}°C ({thermal.label})
                            </strong>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>Safe Ischemia Remaining:</span>
                            <strong className="text-slate-900">
                              {metrics.remainingHours}h / {metrics.limitHours}h
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Logistics-Only Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busyOrganId === id}
                          onClick={() => handleLogisticsTelemetry(organ, 2.6)}
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Log 2.6°C Telemetry
                        </button>

                        <button
                          type="button"
                          onClick={() => setQrTargetOrgan(organ)}
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Carrier QR</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrganId === id}
                          onClick={() => handleLogisticsHandoff(organ, 'authority')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Hand Off to Allocation (Tab 3)</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrganId === id}
                          onClick={() => handleLogisticsHandoff(organ, 'hospital')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Deliver Direct to OR (Tab 4)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: NOTTO ALLOCATION CLEARINGHOUSE PORTAL (?role=authority)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'authority' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  NOTTO Recipient Waitlist & HLA Compatibility Clearance Queue ({primaryQueue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify donor-recipient ABO/HLA tissue compatibility and issue final surgical reception clearance to Tab 4 (Hospital OR)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Authority Key: {currentUser.ethAddress.slice(0, 10)}...
              </span>
            </div>

            {primaryQueue.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  No organs currently awaiting NOTTO Allocation Clearance.
                </p>
                <p className="text-xs text-slate-500">
                  Organs handed off from Tab 2 (Cryo-Logistics) appear here for HLA waitlist verification.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="px-5 py-3">Organ Specimen</th>
                      <th className="px-5 py-3">ABO & HLA Compatibility</th>
                      <th className="px-5 py-3">Matched Recipient & Hospital</th>
                      <th className="px-5 py-3">Viability Window</th>
                      <th className="px-5 py-3 text-right">Allocation Authority Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {primaryQueue.map((organ) => {
                      const id = organ.organId || organ.batchId || '';
                      const metrics = computeColdIschemiaMetrics(
                        organ.harvestTimestamp,
                        organ.ischemicLimitHours,
                        Date.now(),
                        organ.stage
                      );
                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-slate-900 text-sm">{id}</div>
                            <div className="text-slate-600 mt-0.5">{organ.organType}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-slate-900">
                              Blood Group {organ.donorBloodType}
                            </div>
                            <div className="text-emerald-700 font-medium mt-0.5">{organ.hlaMarker}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-slate-900">
                              Recipient {organ.recipientId}
                            </div>
                            <div className="text-slate-500 mt-0.5">{organ.recipientHospital}</div>
                          </td>
                          <td className="px-5 py-4 font-mono tabular-nums">
                            <div className="font-bold text-slate-900">{metrics.remainingHours}h left</div>
                            <div className="text-slate-500 mt-0.5">Temp: {organ.temperatureCelsius}°C</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setCertTargetOrgan(organ)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Inspect Form 8
                              </button>
                              <button
                                type="button"
                                disabled={busyOrganId === id}
                                onClick={() => handleAuthorityApproveAllocation(organ)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>
                                  {busyOrganId === id
                                    ? 'Clearing...'
                                    : 'Approve HLA Match & Dispatch to OR'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: TRANSPLANT HOSPITAL SURGICAL OR PORTAL (?role=hospital)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'hospital' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Apollo Surgical Suite Receiving Queue — Ready for Implantation ({primaryQueue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organs received in the operating theater · Verify cold-ischemia safety and record final graft reperfusion
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Hospital Key: {currentUser.ethAddress.slice(0, 10)}...
              </span>
            </div>

            {primaryQueue.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  No organs currently waiting in the Surgical Operating Suite queue.
                </p>
                <p className="text-xs text-slate-500">
                  Approve allocation in Tab 3 (Allocation Authority) or deliver from Tab 2 (Cryo-Logistics) to receive an organ in OR.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {primaryQueue.map((organ) => {
                  const id = organ.organId || organ.batchId || '';
                  const metrics = computeColdIschemiaMetrics(
                    organ.harvestTimestamp,
                    organ.ischemicLimitHours,
                    Date.now(),
                    organ.stage
                  );

                  return (
                    <div key={id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900 text-base">{id}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-900">{organ.organType}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono font-bold text-rose-700">Blood {organ.donorBloodType}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono text-slate-700">Recipient: {organ.recipientId}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-800">
                          <span>● Pre-Op Crossmatch: Negative (Cleared)</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono tabular-nums">
                            Cold-Ischemia Remaining: {metrics.remainingHours}h (Safe)
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono tabular-nums">
                            Graft Temp: {organ.temperatureCelsius}°C
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCertTargetOrgan(organ)}
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Verify Form 8 Consent
                        </button>

                        <button
                          type="button"
                          disabled={busyOrganId === id}
                          onClick={() => handleHospitalCompleteTransplant(organ)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          <span>
                            {busyOrganId === id
                              ? 'Recording Surgery...'
                              : 'Complete Surgical Implantation'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Transplants Registry */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 font-display">
                Completed Surgical Implantations Registry
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {organs.filter((o) => o.stage === 'Transplanted').length} Grafted
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-5 py-2.5">Organ ID</th>
                    <th className="px-5 py-2.5">Organ Type</th>
                    <th className="px-5 py-2.5">Grafted Recipient</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organs
                    .filter((o) => o.stage === 'Transplanted')
                    .map((organ) => {
                      const id = organ.organId || organ.batchId || '';
                      return (
                        <tr key={id}>
                          <td className="px-5 py-3 font-mono font-bold text-slate-900">{id}</td>
                          <td className="px-5 py-3">{organ.organType}</td>
                          <td className="px-5 py-3 font-mono">{organ.recipientId}</td>
                          <td className="px-5 py-3 font-semibold text-emerald-700">
                            ● Transplanted (Reperfusion Verified)
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setCertTargetOrgan(organ)}
                              className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                            >
                              Form 8 Certificate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: NATIONAL REGULATORY & ANTI-TRAFFICKING PORTAL (?role=admin)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentUser.role === 'admin' && (
        <div className="space-y-6">
          {/* Regulator-Exclusive Segmented Sub-Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setAdminSubTab('oversight')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                adminSubTab === 'oversight'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              1. Anti-Trafficking & Quarantine Desk ({investigations.length} Alerts)
            </button>
            <button
              type="button"
              onClick={() => setAdminSubTab('validators')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                adminSubTab === 'validators'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              2. PoA Validator Nodes & Audit Log
            </button>
            <button
              type="button"
              onClick={() => setAdminSubTab('blockchain')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                adminSubTab === 'blockchain'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              3. SHA-256 Block & Tamper Simulator
            </button>
          </div>

          {adminSubTab === 'oversight' && (
            <div className="space-y-6">
              {/* Whistleblower & Thermal Excursion Investigation Queue */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Statutory Whistleblower & Thermal Excursion Investigation Queue ({investigations.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Incidents filed from Tab 6 (Public Verifier) or IoT thermal sensors appear here for regulatory enforcement
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {investigations.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-rose-700">{rep.id}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono font-semibold text-slate-900">
                            Specimen: {rep.organId || rep.batchId}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-600">
                            {rep.storeName} ({rep.location})
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono font-semibold text-slate-800">
                            Status: {rep.status}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{rep.description}</p>
                        <div className="text-slate-400 font-mono">
                          Reporter: {rep.reporterContact} · Filed {new Date(rep.filedAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdminUpdateInvestigation(rep.id, 'INSPECTOR_ON_SITE')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Dispatch Inspector
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminUpdateInvestigation(rep.id, 'CASE_RESOLVED')}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* National Organ Ledger & Quarantine Enforcement Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      National Organ Registry — Emergency Quarantine Enforcement ({organs.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issuing a regulatory quarantine immediately freezes custody transfers and blocks surgical implantation consortium-wide
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="px-5 py-3">Organ ID & Type</th>
                        <th className="px-5 py-3">Current Custodian</th>
                        <th className="px-5 py-3">Telemetry & Stage</th>
                        <th className="px-5 py-3 text-right">Regulatory Enforcement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {organs.map((organ) => {
                        const id = organ.organId || organ.batchId || '';
                        return (
                          <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-mono font-bold text-slate-900">{id}</div>
                              <div className="text-slate-600 mt-0.5">
                                {organ.organType} · Blood {organ.donorBloodType}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-medium text-slate-900">{organ.currentOwnerName}</div>
                              <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                                {organ.currentOwner}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono tabular-nums">
                              <div
                                className={`font-bold ${
                                  organ.isQuarantined
                                    ? 'text-rose-700'
                                    : organ.stage === 'Transplanted'
                                    ? 'text-emerald-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                {organ.isQuarantined ? 'QUARANTINED' : organ.stage}
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                Temp: {organ.temperatureCelsius}°C · {organ.history?.length || 1} hops
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCertTargetOrgan(organ)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  Audit Form 8
                                </button>
                                {!organ.isQuarantined && organ.stage !== 'Transplanted' ? (
                                  <button
                                    type="button"
                                    disabled={busyOrganId === id}
                                    onClick={() => handleAdminQuarantine(organ)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>
                                      {busyOrganId === id ? 'Freezing...' : 'Emergency Quarantine Freeze'}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="font-mono text-slate-400 text-[11px] px-2">
                                    {organ.isQuarantined ? 'Frozen by Regulator' : 'Surgery Completed'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminSubTab === 'validators' && <ExplorerPage />}
          {adminSubTab === 'blockchain' && <BlockVisualizerPage />}
        </div>
      )}

      {/* Shared Read-Only Document Modals */}
      <CreateBatchModal
        isOpen={isHarvestOpen}
        onClose={() => setIsHarvestOpen(false)}
        onSuccess={(newOrgan) => {
          setQrTargetOrgan(newOrgan);
        }}
      />

      <QRCodeModal
        batch={qrTargetOrgan}
        isOpen={!!qrTargetOrgan}
        onClose={() => setQrTargetOrgan(null)}
      />

      <CertificateModal
        batch={certTargetOrgan}
        cert={certTargetOrgan?.donorConsentCertificate}
        isOpen={!!certTargetOrgan}
        onClose={() => setCertTargetOrgan(null)}
      />
    </div>
  );
}
