import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Award,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import CertificateModal from '../components/CertificateModal';
import ReportModal from '../components/ReportModal';

interface VerifyPageProps {
  initialBatchId?: string | null;
}

const SAMPLE_IDS = [
  { id: 'ORG-KID-8041', label: 'ORG-KID-8041', note: 'Kidney · Harvested (Tab 1)' },
  { id: 'ORG-HRT-2094', label: 'ORG-HRT-2094', note: 'Heart · In Transit (Tab 2)' },
  { id: 'ORG-PAN-6210', label: 'ORG-PAN-6210', note: 'Pancreas · Allocation (Tab 3)' },
  { id: 'ORG-LVR-5512', label: 'ORG-LVR-5512', note: 'Liver · Hospital OR (Tab 4)' },
  { id: 'ORG-COR-3390', label: 'ORG-COR-3390', note: 'Cornea · Quarantined Hold' },
  { id: 'ORG-FAKE-999', label: 'ORG-FAKE-999', note: 'Unregistered Trafficking Test' },
];

export default function VerifyPage({ initialBatchId }: VerifyPageProps) {
  const [organIdInput, setOrganIdInput] = useState(initialBatchId || 'ORG-KID-8041');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorResult, setErrorResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const performVerification = useCallback(
    async (idToVerify?: string) => {
      const id = (idToVerify || organIdInput || '').trim().toUpperCase();
      if (!id) return;

      setLoading(true);
      setResult(null);
      setErrorResult(null);

      try {
        const res = await fetch(`/api/verify/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorResult(data);
        } else {
          setResult(data);
        }
      } catch {
        setErrorResult({
          exists: false,
          organId: id,
          alertTitle: 'Verification Query Error',
          alertDescription: 'Could not reach the LifeLedger verification endpoint.',
          recommendation: 'Verify the server is running and retry.',
        });
      } finally {
        setLoading(false);
      }
    },
    [organIdInput]
  );

  useEffect(() => {
    const target = initialBatchId || 'ORG-KID-8041';
    setOrganIdInput(target);
    performVerification(target);
  }, [initialBatchId, performVerification]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & 1-Click Sample Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-display">
            Public Organ Provenance & Cold-Ischemia Verification Lookup
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter any Organ Specimen ID or scan a cryo-container QR barcode to verify donor Form 8 consent and custody hops
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            performVerification(organIdInput);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <label htmlFor="verify-organ-id-input" className="sr-only">
            Organ Registry ID
          </label>
          <input
            id="verify-organ-id-input"
            type="text"
            value={organIdInput}
            onChange={(e) => setOrganIdInput(e.target.value)}
            placeholder="Enter Organ ID (e.g. ORG-KID-8041)..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 font-mono uppercase font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Organ ID</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            <span>Scan QR Tag</span>
          </button>
        </form>

        {/* 1-Click Demo Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 mr-1">1-Click Test Specimens:</span>
          {SAMPLE_IDS.map((item) => {
            const isSelected = organIdInput.toUpperCase() === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOrganIdInput(item.id);
                  performVerification(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="font-mono font-bold">{item.label}</span>
                <span className={`ml-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  · {item.note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs font-mono text-slate-500">
          Querying LifeLedger PoA Smart Contract Registry...
        </div>
      )}

      {/* Unregistered / Counterfeit Alert */}
      {!loading && errorResult && (
        <div className="bg-rose-50/70 border border-rose-300 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-rose-900 font-bold text-base font-display">
              <ShieldX className="w-5 h-5 text-rose-600 shrink-0" />
              <span>UNREGISTERED ORGAN / TRAFFICKING ALERT — {errorResult.organId}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>File Whistleblower Alert to Regulator (Tab 5)</span>
            </button>
          </div>

          <p className="text-xs text-rose-950 leading-relaxed bg-white p-4 rounded-lg border border-rose-200">
            {errorResult.alertDescription}
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorResult.recommendation}</span>
          </div>
        </div>
      )}

      {/* Verified Organ Record */}
      {!loading && result && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono mb-1">
                  <span
                    className={`font-bold ${
                      result.isQuarantined
                        ? 'text-rose-700'
                        : result.isIschemiaExpired
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    ● {result.status}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">Stage: {result.stage}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">ID: {result.organId}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                  {result.organType || result.medicineName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Current Custodian: <strong className="text-slate-800">{result.currentOwnerName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>View Form 8 Donor Consent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Report Incident</span>
                </button>
              </div>
            </div>

            {result.isQuarantined && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <strong className="block font-bold mb-0.5">REGULATORY QUARANTINE ACTIVE:</strong>
                <span>{result.recallReason || result.alertDescription}</span>
              </div>
            )}

            {/* 4 Key Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Donor Blood & HLA</span>
                <span className="font-mono font-bold text-slate-900 text-lg mt-0.5 block">
                  {result.donorBloodType}
                </span>
                <span className="text-slate-500 block mt-0.5">{result.hlaMarker}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Cold-Ischemia Window</span>
                <span
                  className={`font-mono font-bold text-lg mt-0.5 block tabular-nums ${
                    result.isIschemiaExpired ? 'text-rose-700' : 'text-slate-900'
                  }`}
                >
                  {result.remainingIschemiaHours}h remaining
                </span>
                <span className="text-slate-500 block mt-0.5 tabular-nums">
                  Max Safe Limit: {result.ischemicLimitHours}h
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Cryo-Container Temp</span>
                <span className="font-mono font-bold text-slate-900 text-lg mt-0.5 block tabular-nums">
                  {result.telemetry?.currentTemperatureCelsius ?? 2.8}°C
                </span>
                <span className="text-emerald-700 font-medium block mt-0.5">
                  Target: 2.0°C – 4.0°C
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Allocated Recipient</span>
                <span className="font-mono font-bold text-slate-900 text-lg mt-0.5 block">
                  {result.recipientId}
                </span>
                <span className="text-slate-500 truncate block mt-0.5">{result.recipientHospital}</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Chain of Custody Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display">
                  Immutable Chain-of-Custody Audit Trail ({result.history?.length || 1} Verified Hops)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every handoff is cryptographically signed by the custodian node on LifeLedger.sol
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tamper-Evident Ledger</span>
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {(result.history || []).map((step: {
                stage: string;
                roleFrom: string;
                roleTo: string;
                timestamp: string;
                from: string;
                to: string;
                location: string;
                temperatureCelsius?: number;
                notes: string;
                txHash?: string;
              }, idx: number) => (
                <div key={idx} className="p-4 bg-white text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <span className="font-mono text-blue-700 tabular-nums">Hop #{idx + 1}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{step.stage}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500 font-normal">
                        {step.roleFrom} → {step.roleTo}
                      </span>
                    </div>
                    <div className="font-mono text-slate-500 tabular-nums">
                      {step.temperatureCelsius !== undefined && (
                        <span className="mr-3 font-semibold text-slate-700">{step.temperatureCelsius}°C</span>
                      )}
                      <span>{new Date(step.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-slate-700">
                    <strong>Custody Transfer:</strong> {step.from} → {step.to} ({step.location})
                  </div>

                  <div className="text-slate-500">{step.notes}</div>

                  {step.txHash && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-xl">TxHash: {step.txHash}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(step.txHash!, `tx_${idx}`)}
                        className="px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {copiedHash === `tx_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHash === `tx_${idx}` ? 'Copied' : 'Copy Hash'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedId: string) => {
          setOrganIdInput(scannedId);
          performVerification(scannedId);
        }}
      />

      <CertificateModal
        batch={result}
        cert={result?.donorConsentCertificate || result?.qualityCertificate}
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      <ReportModal
        batchId={errorResult ? errorResult.organId : result?.organId}
        organType={errorResult ? 'Suspected Organ Transit Incident' : result?.organType}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
