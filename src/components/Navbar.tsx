import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoleId } from '../utils/roleWorkflow';

export default function Navbar() {
  const { currentUser, switchRole, demoUsers } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href={`/?role=${currentUser.role}`}
          onClick={(e) => {
            e.preventDefault();
            switchRole(currentUser.role);
          }}
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          LifeLedger
        </a>

        {/* Zone 2: Clean single-line text navigation links for the 6 isolated role services */}
        <nav
          aria-label="Consortium Role Services"
          className="flex items-center gap-5 overflow-x-auto text-sm font-medium text-slate-600 py-0.5"
        >
          {demoUsers.map((service) => {
            const isActive = currentUser.role === service.role;
            return (
              <a
                key={service.role}
                href={`/?role=${service.role}`}
                onClick={(e) => {
                  // Allow Ctrl/Cmd/middle click to open in a separate browser tab naturally
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                  e.preventDefault();
                  switchRole(service.role as RoleId);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {service.navLabel}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Active Tab Service Context */}
        <div className="hidden md:flex items-center shrink-0 text-xs font-mono text-slate-500">
          Tab {currentUser.tabNumber}/6 · {currentUser.shortBadge}
        </div>
      </div>
    </header>
  );
}
