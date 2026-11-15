import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import RoleServicePortal from './pages/RoleServicePortal';

function AppShell() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <RoleServicePortal />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>LifeLedger Organ Procurement & Cold-Ischemia Consortium</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Active Portal: Tab {currentUser.tabNumber} ({currentUser.shortBadge})</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              API Health
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/api/stats"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors font-mono"
            >
              Ledger Stats JSON
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
