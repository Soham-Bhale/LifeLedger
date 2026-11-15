import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { RoleId } from '../utils/roleWorkflow';

interface PresentationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationGuideModal({ isOpen, onClose }: PresentationGuideModalProps) {
  const { currentUser, switchRole, demoUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<'tabs' | 'script' | 'qa'>('tabs');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 id="guide-modal-title" className="text-base font-bold tracking-tight font-display">
              LifeLedger — 6-Tab Role Isolation & Judge Defense Guide
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each consortium stakeholder operates in an isolated portal with zero cross-service UI clutter
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Judge Demo Guide"
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tabs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tabs'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            1. The 6 Isolated Service Tabs (run.bat)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'script'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            2. 60-Second Live Demo Script
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'qa'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            3. Judge Viva Q&A Answers
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {activeTab === 'tabs' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 text-sm mb-1">
                  How <code className="font-mono text-blue-700">run.bat</code> Launches All 6 Role Portals Separately
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Running <code className="font-mono font-semibold text-slate-800">run.bat</code> automatically opens 6 separate browser tabs—one for each stakeholder role (<code className="font-mono">?role=opo</code> through <code className="font-mono">?role=customer</code>). Each tab stores its role in isolated per-tab <code className="font-mono">sessionStorage</code> and syncs organ state live via <code className="font-mono">BroadcastChannel</code>.
                </p>
              </div>

              <div className="space-y-2.5">
                {demoUsers.map((service) => {
                  const isCurrent = currentUser.role === service.role;
                  return (
                    <div
                      key={service.role}
                      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900">
                            Tab {service.tabNumber} · {service.badge}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-mono text-blue-700">/?role={service.role}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{service.judgePitch}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            switchRole(service.role as RoleId);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isCurrent ? 'Active Here' : 'Switch Here'}
                        </button>
                        <a
                          href={`/?role=${service.role}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <span>Open Separate Tab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  Step 1 — Tab 1: OPO Harvest Portal (<code className="font-mono text-blue-700">/?role=opo</code>)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Show judges that OPO only sees procurement controls. Click <strong>Register & Harvest Organ</strong> (or use pre-loaded <code className="font-mono">ORG-KID-8041</code>) and click <strong>Dispatch to Cryo-Logistics</strong>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  Step 2 — Tab 2: Cryo-Logistics Portal (<code className="font-mono text-blue-700">/?role=logistics</code>)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Switch to Tab 2. The dispatched organ appears automatically. Log a cold-chain temperature check (<code className="font-mono">2.6°C</code>) and click <strong>Hand Off to NOTTO Allocation</strong>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  Step 3 — Tab 3: Allocation Clearinghouse (<code className="font-mono text-blue-700">/?role=authority</code>)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Switch to Tab 3. Review the Donor-Recipient 6/6 HLA compatibility match and click <strong>Approve HLA Match & Dispatch to OR</strong>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  Step 4 — Tab 4: Transplant Hospital OR (<code className="font-mono text-blue-700">/?role=hospital</code>)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Switch to Tab 4. Verify the Pre-Op Viability Checklist (cold-ischemia timer still green) and click <strong>Complete Surgical Implantation</strong>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  Step 5 — Tab 5 & Tab 6: Regulatory Freeze & Public Verification
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In Tab 5 (<code className="font-mono">/?role=admin</code>), demonstrate an <strong>Emergency Quarantine Freeze</strong> or open the <strong>SHA-256 Block Tamper Simulator</strong>. In Tab 6 (<code className="font-mono">/?role=customer</code>), verify any organ ID or test <code className="font-mono">ORG-FAKE-999</code> to trigger an anti-trafficking alert.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Q1: Why doesn’t an OPO or Courier see the Hospital "Implant" or Regulator "Quarantine" buttons?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Each stakeholder microservice is strictly role-gated both in the UI and in <code className="font-mono">LifeLedger.sol</code> smart contract modifiers (<code className="font-mono">onlyApproved(Role.OPO)</code>, <code className="font-mono">onlyApproved(Role.Hospital)</code>). Separating the 6 interfaces prevents clinical errors and enforces separation of duties.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Q2: How does the smart contract prevent transplanting an expired or trafficked organ?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Upon harvest, <code className="font-mono">harvestTimestamp</code> and <code className="font-mono">ischemicLimitHours</code> (e.g., 4h for Heart, 24h for Kidney) are locked on-chain. When the hospital calls <code className="font-mono">completeTransplant()</code>, the contract checks <code className="font-mono">elapsedHours &lt;= ischemicLimitHours</code> and <code className="font-mono">!isQuarantined</code>—reverting the transaction if either invariant fails.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Q3: Why Proof-of-Authority (PoA) instead of public Proof-of-Work?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Medical organ networks require zero gas fees, instant 2-second block finality, and legally vetted hospital/OPO validators rather than anonymous miners.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All 6 role tabs synchronize automatically in real time</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Return to Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
