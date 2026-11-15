import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ExplorerPage() {
  const { participants } = useAuth();
  const [stats, setStats] = useState<{
    network?: { smartContractAddress?: string; networkName?: string; chainId?: number };
    organs?: { total?: number };
    investigations?: unknown[];
    recentVerifications?: {
      id: string;
      organId?: string;
      batchId?: string;
      timestamp: string;
      device: string;
      result: string;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-display">
            Proof-of-Authority (PoA) Validator Nodes & Verification Audit Log
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized healthcare institutions holding cryptographic signing keys on LifeLedger.sol
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Node Status</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Smart Contract Address</div>
          <div className="font-mono font-bold text-slate-900 text-xs mt-1 truncate">
            {stats?.network?.smartContractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}
          </div>
          <div className="text-xs text-slate-400 mt-1">LifeLedger.sol · Solidity 0.8.20</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Consortium Consensus</div>
          <div className="font-mono font-bold text-slate-900 text-sm mt-1 tabular-nums">
            Chain ID {stats?.network?.chainId || 1337} · PoA
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">● Nominal · Zero-Gas Healthcare</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Registered Validators</div>
          <div className="font-mono font-bold text-slate-900 text-2xl mt-1 tabular-nums">
            {participants.length || 5}
          </div>
          <div className="text-xs text-slate-400 mt-1">NOTTO Accredited Signers</div>
        </div>
      </div>

      {/* Validators Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 font-display">
            Approved Consortium Stakeholder Nodes
          </h4>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {participants.length} Validators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="px-4 py-3">Stakeholder Institution</th>
                <th className="px-4 py-3">Service Role</th>
                <th className="px-4 py-3">Operating Location</th>
                <th className="px-4 py-3">Ethereum Validator Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 font-mono uppercase text-slate-700">{p.role}</td>
                  <td className="px-4 py-3 text-slate-600">{p.location}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>{p.ethAddress}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.ethAddress, p.id)}
                        aria-label={`Copy address for ${p.name}`}
                        className="px-2 py-0.5 text-[11px] font-sans font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {copiedKey === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === p.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 font-display">
            Recent Public Verification Queries
          </h4>
          <span className="text-xs text-slate-500">Live Audit Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="px-4 py-3">Scan ID</th>
                <th className="px-4 py-3">Organ ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.recentVerifications || []).map((v, i) => (
                <tr key={v.id || i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">{v.id}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{v.organId || v.batchId}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 tabular-nums">
                    {new Date(v.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    <span className={v.result === 'GENUINE_AUTHENTIC' ? 'text-emerald-700' : 'text-rose-700'}>
                      {v.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
