import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoleId } from '../utils/roleWorkflow';

interface NavbarProps {
  onOpenGuide: () => void;
}

export default function Navbar({ onOpenGuide }: NavbarProps) {
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

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenGuide}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Judge Demo Guide
          </button>
        </div>
      </div>
    </header>
  );
}
