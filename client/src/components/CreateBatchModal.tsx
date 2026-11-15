import React, { useState, useEffect } from 'react';
import { X, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { OrganRecord } from '../utils/roleWorkflow';

interface OrganFormState {
  organId: string;
  organType: string;
  donorId: string;
  donorBloodType: string;
  hlaMarker: string;
  ischemicLimitHours: number;
  recipientId: string;
  recipientHospital: string;
  preservationProtocol: string;
  initialTemp: number;
  notes: string;
}

const EMPTY_FORM: OrganFormState = {
  organId: '',
  organType: 'Kidney (Left)',
  donorId: '',
  donorBloodType: 'O+',
  hlaMarker: '',
  ischemicLimitHours: 24,
  recipientId: '',
  recipientHospital: 'Apollo Multi-Specialty Transplant Surgical Center',
  preservationProtocol: 'University of Wisconsin (UW) Cold Solution',
  initialTemp: 2.8,
  notes: '',
};

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newOrgan: OrganRecord) => void;
}

export default function CreateBatchModal({ isOpen, onClose, onSuccess }: CreateBatchModalProps) {
  const { broadcastSync } = useAuth();
  const [formData, setFormData] = useState<OrganFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organId.trim() || !formData.donorId.trim() || !formData.recipientId.trim()) {
      setError('Organ Specimen ID, Donor ID, and Matched Recipient ID are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/organs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-role': 'opo',
        },
        body: JSON.stringify({
          ...formData,
          organId: formData.organId.trim().toUpperCase(),
          donorId: formData.donorId.trim().toUpperCase(),
          recipientId: formData.recipientId.trim().toUpperCase(),
          hlaMarker: formData.hlaMarker.trim() || 'HLA Crossmatch Verified',
          ischemicLimitHours: Number(formData.ischemicLimitHours),
          initialTemp: Number(formData.initialTemp),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register donor organ');
      }

      broadcastSync();
      setLoading(false);
      if (onSuccess) onSuccess(data.organ || data.batch);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register donor organ');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="harvest-modal-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="harvest-modal-title" className="text-base font-bold text-white tracking-tight font-display">
                OPO Service — Harvest & Register Donor Organ
              </h3>
              <p className="text-xs text-slate-400">
                Locks Brain-Death Form 8 Consent Hash & Starts Cold-Ischemia Timer on LifeLedger.sol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Harvest Modal"
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="organ-id-input" className="block font-semibold text-slate-700 mb-1">
                Organ Specimen ID *
              </label>
              <input
                id="organ-id-input"
                type="text"
                required
                placeholder="e.g. ORG-KID-101"
                value={formData.organId}
                onChange={(e) => setFormData({ ...formData, organId: e.target.value })}
                className="w-full px-3 py-2 font-mono uppercase font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="organ-type-select" className="block font-semibold text-slate-700 mb-1">
                Organ Type *
              </label>
              <select
                id="organ-type-select"
                value={formData.organType}
                onChange={(e) => setFormData({ ...formData, organType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="Kidney (Left)">Kidney (Left)</option>
                <option value="Kidney (Right)">Kidney (Right)</option>
                <option value="Heart (Whole)">Heart (Whole)</option>
                <option value="Liver (Whole)">Liver (Whole)</option>
                <option value="Double Lung">Double Lung</option>
                <option value="Pancreas (Whole)">Pancreas (Whole)</option>
                <option value="Cornea Graft">Cornea Graft</option>
              </select>
            </div>

            <div>
              <label htmlFor="blood-group-select" className="block font-semibold text-slate-700 mb-1">
                Donor ABO Blood Group *
              </label>
              <select
                id="blood-group-select"
                value={formData.donorBloodType}
                onChange={(e) => setFormData({ ...formData, donorBloodType: e.target.value })}
                className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="donor-id-input" className="block font-semibold text-slate-700 mb-1">
                Anonymized Donor ID *
              </label>
              <input
                id="donor-id-input"
                type="text"
                required
                placeholder="e.g. DNR-MUM-01"
                value={formData.donorId}
                onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                className="w-full px-3 py-2 font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ischemia-limit-input" className="block font-semibold text-slate-700 mb-1">
                Max Cold-Ischemia Limit (Hours) *
              </label>
              <input
                id="ischemia-limit-input"
                type="number"
                min="1"
                max="72"
                required
                value={formData.ischemicLimitHours}
                onChange={(e) => setFormData({ ...formData, ischemicLimitHours: Number(e.target.value) })}
                className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="initial-temp-input" className="block font-semibold text-slate-700 mb-1">
                Initial Perfusion Temp (°C) *
              </label>
              <input
                id="initial-temp-input"
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={formData.initialTemp}
                onChange={(e) => setFormData({ ...formData, initialTemp: Number(e.target.value) })}
                className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hla-marker-input" className="block font-semibold text-slate-700 mb-1">
                HLA Histocompatibility Profile *
              </label>
              <input
                id="hla-marker-input"
                type="text"
                required
                placeholder="e.g. 6/6 HLA-Matched"
                value={formData.hlaMarker}
                onChange={(e) => setFormData({ ...formData, hlaMarker: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="recipient-id-input" className="block font-semibold text-slate-700 mb-1">
                Matched Recipient ID *
              </label>
              <input
                id="recipient-id-input"
                type="text"
                required
                placeholder="e.g. RCP-1001"
                value={formData.recipientId}
                onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                className="w-full px-3 py-2 font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="clinical-notes-input" className="block font-semibold text-slate-700 mb-1">
              Surgical Retrieval & Form 8 Consent Attestation
            </label>
            <textarea
              id="clinical-notes-input"
              rows={2}
              placeholder="Enter neurological brain-death confirmation and preservation flush notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Signed by OPO Validator (0x709979...79C8)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Recording on Blockchain...' : 'Register Harvest on Blockchain'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
