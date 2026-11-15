import React, { useState, useEffect } from 'react';
import { X, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { OrganRecord } from '../utils/roleWorkflow';

interface OrganPreset {
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

const ORGAN_PRESETS: Record<'kidney' | 'heart' | 'liver', OrganPreset> = {
  kidney: {
    organId: 'ORG-KID-8102',
    organType: 'Kidney (Left)',
    donorId: 'DNR-DEL-4091',
    donorBloodType: 'O+',
    hlaMarker: '6/6 HLA-Matched (A*02, B*44, DRB1*04)',
    ischemicLimitHours: 24,
    recipientId: 'RCP-4109',
    recipientHospital: 'Apollo Multi-Specialty Transplant Surgical Center',
    preservationProtocol: 'University of Wisconsin (UW) Cold Solution',
    initialTemp: 2.4,
    notes: 'Brain death confirmed by two independent neurological evaluations. Next-of-kin Form 8 consent cryptographically signed.',
  },
  heart: {
    organId: 'ORG-HRT-3109',
    organType: 'Heart (Whole)',
    donorId: 'DNR-BLR-8821',
    donorBloodType: 'A+',
    hlaMarker: '5/6 HLA-Matched (Cardiac STAT 1A)',
    ischemicLimitHours: 4,
    recipientId: 'RCP-8831',
    recipientHospital: 'Apollo Multi-Specialty Transplant Surgical Center',
    preservationProtocol: 'Custodiol HTK Hypothermic Cardioplegia',
    initialTemp: 1.8,
    notes: 'STAT Priority 1A. Direct green-corridor air ambulance dispatch required. Echocardiogram LVEF 65%.',
  },
  liver: {
    organId: 'ORG-LVR-6604',
    organType: 'Liver (Whole)',
    donorId: 'DNR-HYD-7712',
    donorBloodType: 'B+',
    hlaMarker: '6/6 HLA-Matched (PRA < 10%)',
    ischemicLimitHours: 12,
    recipientId: 'RCP-3301',
    recipientHospital: 'Apollo Multi-Specialty Transplant Surgical Center',
    preservationProtocol: 'Celsior Hypothermic Perfusion Solution',
    initialTemp: 3.1,
    notes: 'Cadaveric donor liver procured in sterile surgical field. Biopsy confirms zero micro-steatosis.',
  },
};

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newOrgan: OrganRecord) => void;
}

export default function CreateBatchModal({ isOpen, onClose, onSuccess }: CreateBatchModalProps) {
  const { broadcastSync } = useAuth();
  const [formData, setFormData] = useState<OrganPreset>(ORGAN_PRESETS.kidney);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...ORGAN_PRESETS.kidney,
        organId: 'ORG-KID-' + Math.floor(1000 + Math.random() * 9000),
        donorId: 'DNR-DEL-' + Math.floor(1000 + Math.random() * 9000),
      });
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadPreset = (key: 'kidney' | 'heart' | 'liver') => {
    const preset = ORGAN_PRESETS[key];
    setFormData({
      ...preset,
      organId: preset.organId.slice(0, 8) + Math.floor(1000 + Math.random() * 9000),
      donorId: preset.donorId.slice(0, 8) + Math.floor(1000 + Math.random() * 9000),
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organId.trim() || !formData.donorId.trim() || !formData.recipientId.trim()) {
      setError('Organ ID, Donor ID, and Target Recipient ID are required.');
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

        {/* Quick Organ Preset Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-600">1-Click Clinical Presets:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPreset('kidney')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Kidney Graft (24h Window)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('heart')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Heart Graft (4h STAT)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('liver')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Liver Graft (12h Window)
            </button>
          </div>
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
                Organ Specimen ID
              </label>
              <input
                id="organ-id-input"
                type="text"
                required
                value={formData.organId}
                onChange={(e) => setFormData({ ...formData, organId: e.target.value })}
                className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="organ-type-select" className="block font-semibold text-slate-700 mb-1">
                Organ Type
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
                Donor ABO Blood Group
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
                Anonymized Donor ID
              </label>
              <input
                id="donor-id-input"
                type="text"
                required
                value={formData.donorId}
                onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ischemia-limit-input" className="block font-semibold text-slate-700 mb-1">
                Max Cold-Ischemia Limit (Hours)
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
                Initial Perfusion Temp (°C)
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
                HLA Histocompatibility Profile
              </label>
              <input
                id="hla-marker-input"
                type="text"
                required
                value={formData.hlaMarker}
                onChange={(e) => setFormData({ ...formData, hlaMarker: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="recipient-id-input" className="block font-semibold text-slate-700 mb-1">
                Matched Recipient ID
              </label>
              <input
                id="recipient-id-input"
                type="text"
                required
                value={formData.recipientId}
                onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
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
