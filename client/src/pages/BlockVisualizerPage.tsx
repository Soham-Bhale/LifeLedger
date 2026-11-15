import React, { useState } from 'react';
import {
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface BlockTx {
  txHash: string;
  type: string;
  desc: string;
  sender: string;
  receiver: string;
  details?: string;
}

interface BlockItem {
  blockNumber: number;
  timestamp: string;
  validator: string;
  validatorAddr: string;
  prevHash: string;
  hash: string;
  tampered: boolean;
  isBroken?: boolean;
  transactions: BlockTx[];
}

const INITIAL_BLOCKS: BlockItem[] = [
  {
    blockNumber: 0,
    timestamp: '2026-10-28 08:00:00 UTC',
    validator: 'Genesis Consortium (NOTTO Multi-Sig)',
    validatorAddr: '0x0000000000000000000000000000000000000000',
    prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    hash: '0x8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    tampered: false,
    transactions: [
      {
        txHash: '0xgen01',
        type: 'CONTRACT_DEPLOYMENT',
        desc: 'LifeLedger.sol deployed on Ethereum PoA Consortium network',
        sender: 'NOTTO Directorate',
        receiver: 'Consortium Contract',
      },
    ],
  },
  {
    blockNumber: 1,
    timestamp: '2026-10-28 09:15:22 UTC',
    validator: 'Lilavati Hospital OPO Node (Tab 1)',
    validatorAddr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    prevHash: '0x8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    hash: '0x1c3e5a7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c',
    tampered: false,
    transactions: [
      {
        txHash: '0xharv01',
        type: 'ORGAN_HARVEST',
        desc: 'Harvested ORG-KID-8041 (Kidney, Donor: DNR-MUM-9021, Blood: O+)',
        sender: 'Lilavati OPO',
        receiver: 'Cryo Container #8041',
        details: 'Brain death Form 8 consent pinned to IPFS CID; 30h cold-ischemia clock started.',
      },
    ],
  },
  {
    blockNumber: 2,
    timestamp: '2026-10-28 10:40:11 UTC',
    validator: 'AeroMed Cryo-Logistics Node (Tab 2)',
    validatorAddr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    prevHash: '0x1c3e5a7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c',
    hash: '0x9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    tampered: false,
    transactions: [
      {
        txHash: '0xtran01',
        type: 'CUSTODY_HANDOFF',
        desc: 'Custody transferred from Lilavati OPO to AeroMed Air Ambulance (2.8°C)',
        sender: 'Lilavati OPO',
        receiver: 'AeroMed Logistics',
      },
    ],
  },
  {
    blockNumber: 3,
    timestamp: '2026-10-28 12:05:45 UTC',
    validator: 'NOTTO Allocation Authority (Tab 3)',
    validatorAddr: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    prevHash: '0x9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    hash: '0x4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e',
    tampered: false,
    transactions: [
      {
        txHash: '0xalloc01',
        type: 'RECIPIENT_ALLOCATION',
        desc: 'Cleared 6/6 HLA match to Recipient RCP-7704 at Apollo Transplant Center',
        sender: 'NOTTO Allocation',
        receiver: 'Apollo Hospital OR',
      },
    ],
  },
];

export default function BlockVisualizerPage() {
  const [blocks, setBlocks] = useState<BlockItem[]>(INITIAL_BLOCKS);
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const handleTamperBlock = async (blockIndex: number) => {
    const updated = [...blocks];
    const target = { ...updated[blockIndex] };

    target.tampered = true;
    target.transactions = target.transactions.map((t, i) =>
      i === 0
        ? {
            ...t,
            desc: 'FORGED RECORD: Organ diverted to unverified commercial buyer',
            receiver: '0xUNREGISTERED_BUYER',
          }
        : t
    );

    const rawData = JSON.stringify({
      num: target.blockNumber,
      prev: target.prevHash,
      txs: target.transactions,
      salt: 'TAMPERED_DATA',
    });
    target.hash = await sha256(rawData);
    updated[blockIndex] = target;

    for (let i = blockIndex + 1; i < updated.length; i++) {
      updated[i] = { ...updated[i], isBroken: true };
    }

    setBlocks(updated);
    setTamperedBlockIndex(blockIndex);
  };

  const handleRestoreLedger = () => {
    setBlocks(INITIAL_BLOCKS);
    setTamperedBlockIndex(null);
  };

  const handleMintNewBlock = async () => {
    if (isMinting) return;
    setIsMinting(true);
    await new Promise((r) => setTimeout(r, 400));

    const lastBlock = blocks[blocks.length - 1];
    const newBlockNumber = blocks.length;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    const newTransactions: BlockTx[] = [
      {
        txHash: '0ximplant' + Math.floor(1000 + Math.random() * 9000),
        type: 'SURGICAL_IMPLANTATION',
        desc: 'Apollo Hospital OR (Tab 4) confirmed successful anastomosis & reperfusion for ORG-KID-8041',
        sender: 'Apollo Hospital OR',
        receiver: 'Recipient RCP-7704',
      },
    ];

    const newHash = await sha256(
      JSON.stringify({
        num: newBlockNumber,
        prev: lastBlock.hash,
        txs: newTransactions,
        time: now,
      })
    );

    setBlocks((prev) => [
      ...prev,
      {
        blockNumber: newBlockNumber,
        timestamp: now,
        validator: 'Apollo Transplant Hospital Node (Tab 4)',
        validatorAddr: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        prevHash: lastBlock.hash,
        hash: newHash,
        tampered: false,
        transactions: newTransactions,
      },
    ]);
    setIsMinting(false);

    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-display">
            Interactive SHA-256 Hash-Chain & Tamper Detection Simulator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates to judges how altering any historical organ custody record breaks downstream cryptographic block links
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tamperedBlockIndex !== null && (
            <button
              type="button"
              onClick={handleRestoreLedger}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Valid Chain</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleMintNewBlock}
            disabled={isMinting || tamperedBlockIndex !== null}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isMinting ? 'Signing Block...' : `Mint Block #${blocks.length} (PoA)`}</span>
          </button>
        </div>
      </div>

      {tamperedBlockIndex !== null && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="text-rose-900 text-sm block">
                Cryptographic Hash Mismatch Detected at Block #{tamperedBlockIndex}
              </strong>
              <span className="text-rose-800">
                Altering Block #{tamperedBlockIndex} changed its SHA-256 output, invalidating Block #{tamperedBlockIndex + 1}&apos;s stored <code className="font-mono">prevHash</code> pointer.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreLedger}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Revert Tampered Data
          </button>
        </div>
      )}

      <div className="space-y-3">
        {blocks.map((block, idx) => {
          const isLast = idx === blocks.length - 1;
          const nextBlock = blocks[idx + 1];
          const isLinkValid = nextBlock ? nextBlock.prevHash.toLowerCase() === block.hash.toLowerCase() : true;

          return (
            <div key={block.blockNumber}>
              <div
                className={`p-4 rounded-xl border ${
                  block.tampered
                    ? 'border-rose-500 bg-rose-50/40'
                    : block.isBroken
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        Block #{block.blockNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600 font-medium">{block.validator}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono text-slate-400 tabular-nums">{block.timestamp}</span>
                    </div>
                  </div>

                  <div>
                    {block.blockNumber > 0 && !block.tampered && !block.isBroken && (
                      <button
                        type="button"
                        onClick={() => handleTamperBlock(idx)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Simulate Tamper on Block #{block.blockNumber}</span>
                      </button>
                    )}
                    {block.tampered && (
                      <button
                        type="button"
                        onClick={handleRestoreLedger}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Restore Original Block</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs font-mono">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] font-sans text-slate-500">Previous Block Hash (prevHash)</div>
                    <div className="truncate font-semibold text-slate-700 mt-0.5">{block.prevHash}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] font-sans text-slate-500">Current Block SHA-256 Hash</div>
                    <div
                      className={`truncate font-bold mt-0.5 ${
                        block.tampered ? 'text-rose-700' : 'text-blue-700'
                      }`}
                    >
                      {block.hash}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {block.transactions.map((tx, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-700 mr-2">{tx.type}</span>
                        <span className="font-semibold text-slate-900">{tx.desc}</span>
                      </div>
                      <span className="font-mono text-slate-500 shrink-0">
                        {tx.sender} → {tx.receiver}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center justify-center py-1.5 text-xs font-mono">
                  {isLinkValid ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Hash Link Verified (Block #{block.blockNumber} → Block #{block.blockNumber + 1})</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>BROKEN HASH LINK: Block #{block.blockNumber + 1} rejects tampered parent hash</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
