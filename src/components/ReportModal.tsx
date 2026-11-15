import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  batchId?: string;
  organType?: string;
  medicineName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (report: unknown) => void;
}

export default function ReportModal({
  batchId,
  organType,
  medicineName,
  isOpen,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const { broadcastSync } = useAuth();
  const [formData, setFormData] = useState({
    facilityName: 'Metro Critical Care OR #4',
    location: 'Mumbai Suburban Area',
    violationCategory: 'Cold-Chain Thermal Excursion (> 8°C)',
    description:
      'Cryo-carrier reading spiked to 9.4°C during highway transport. Suspected cold perfusion seal failure.',
    reporterContact: 'Dr. A. Verma, Transplant Quality Officer',
  });
  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<{
    id: string;
    organId?: string;
    batchId?: string;
    storeName?: string;
    filedAt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetId = batchId || 'UNVERIFIED_SPECIMEN';
  const targetType = organType || medicineName || 'Human Organ Graft';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.facilityName.trim() || !formData.description.trim()) {
      setError('Facility name and narrative description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verify/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organId: targetId,
          batchId: targetId,
          medicineName: targetType,
          storeName: formData.facilityName,
          location: formData.location,
          description: `[${formData.violationCategory}] ${formData.description}`,
          reporterContact: formData.reporterContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit incident alert');

      setSubmittedReport(data.report);
      broadcastSync();
      setLoading(false);
      if (onSuccess) onSuccess(data.report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit incident alert');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmittedReport(null);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="report-modal-title" className="text-base font-bold text-white tracking-tight font-display">
                Statutory Whistleblower & Incident Report
              </h3>
              <p className="text-xs text-slate-400">
                Dispatches a live compliance alert to Tab 5 (NOTTO Regulatory Authority)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Incident Report Modal"
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedReport ? (
          <div className="p-6 bg-slate-50 space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Incident Registered in National Oversight Queue</span>
              </div>
              <p className="text-slate-700">
                Case Reference: <strong className="font-mono text-emerald-900">{submittedReport.id}</strong>
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-slate-700">
                <div>
                  <strong>Organ Specimen:</strong> <span className="font-mono">{submittedReport.organId || submittedReport.batchId}</span>
                </div>
                <div>
                  <strong>Facility:</strong> {submittedReport.storeName}
                </div>
              </div>
            </div>

            <p className="text-slate-600">
              This alert has been broadcast live to <strong>Tab 5 (5. Regulator)</strong> for immediate investigation or quarantine enforcement.
            </p>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Submitting this report dispatches an instant compliance case to the NOTTO Regulatory Authority without leaving your current verifier view.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-semibold">Target Specimen ID:</span>
              <span className="font-mono font-bold text-rose-700">{targetId}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">{targetType}</span>
            </div>

            <div>
              <label htmlFor="violation-category-select" className="block font-semibold text-slate-700 mb-1">
                Violation Classification
              </label>
              <select
                id="violation-category-select"
                value={formData.violationCategory}
                onChange={(e) => setFormData({ ...formData, violationCategory: e.target.value })}
                className="w-full px-3 py-2 font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Cold-Chain Thermal Excursion (> 8°C)">Cold-Chain Thermal Excursion (&gt; 8°C)</option>
                <option value="Suspected Commercial Organ Trafficking">Suspected Commercial Organ Trafficking</option>
                <option value="Unregistered / Unverified Organ ID">Unregistered / Unverified Organ ID</option>
                <option value="Forged Donor Form 8 Consent Papers">Forged Donor Form 8 Consent Papers</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="report-facility-input" className="block font-semibold text-slate-700 mb-1">
                  Facility / Transit Hub
                </label>
                <input
                  id="report-facility-input"
                  type="text"
                  required
                  value={formData.facilityName}
                  onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label htmlFor="report-location-input" className="block font-semibold text-slate-700 mb-1">
                  City / Location
                </label>
                <input
                  id="report-location-input"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="report-desc-input" className="block font-semibold text-slate-700 mb-1">
                Incident Observations
              </label>
              <textarea
                id="report-desc-input"
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="report-contact-input" className="block font-semibold text-slate-700 mb-1">
                Observer / Contact
              </label>
              <input
                id="report-contact-input"
                type="text"
                required
                value={formData.reporterContact}
                onChange={(e) => setFormData({ ...formData, reporterContact: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
