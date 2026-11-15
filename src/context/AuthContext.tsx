import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ROLE_SERVICES,
  resolveActiveRole,
  getRoleService,
  type RoleId,
  type RoleServiceDefinition,
  type OrganRecord,
} from '../utils/roleWorkflow';

export interface ParticipantNode {
  id: string;
  name: string;
  role: string;
  organization: string;
  location: string;
  ethAddress: string;
  isApproved: boolean;
  licenseNumber?: string;
}

export interface InvestigationReport {
  id: string;
  organId: string;
  batchId?: string;
  medicineName?: string;
  storeName: string;
  location: string;
  reportType?: string;
  description: string;
  reporterContact: string;
  status: string;
  filedAt: string;
}

interface AuthContextValue {
  currentUser: RoleServiceDefinition;
  switchRole: (role: RoleId | string) => void;
  demoUsers: RoleServiceDefinition[];
  participants: ParticipantNode[];
  organs: OrganRecord[];
  investigations: InvestigationReport[];
  investigationCount: number;
  loading: boolean;
  lastSyncedAt: string;
  refreshStats: () => Promise<void>;
  broadcastSync: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_ROLE_KEY = 'lifeledger_tab_role';
const SYNC_CHANNEL_NAME = 'lifeledger_consortium_sync';
const SYNC_STORAGE_KEY = 'lifeledger_last_sync_ping';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<RoleId>(() => {
    if (typeof window === 'undefined') return 'opo';
    const sessionSaved = window.sessionStorage.getItem(SESSION_ROLE_KEY);
    const resolved = resolveActiveRole(window.location.search, sessionSaved);
    try {
      window.sessionStorage.setItem(SESSION_ROLE_KEY, resolved);
    } catch {
      // ignore storage errors
    }
    return resolved;
  });

  const [participants, setParticipants] = useState<ParticipantNode[]>([]);
  const [organs, setOrgans] = useState<OrganRecord[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchAllConsortiumData = useCallback(async () => {
    try {
      const [organsRes, statsRes] = await Promise.all([
        fetch('/api/organs'),
        fetch('/api/stats'),
      ]);
      if (organsRes.ok) {
        const organsData = await organsRes.json();
        setOrgans(organsData.organs || organsData.batches || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (Array.isArray(statsData.investigations)) {
          setInvestigations(statsData.investigations);
        }
      }
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  const broadcastSync = useCallback(() => {
    fetchAllConsortiumData();
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'LEDGER_UPDATED', ts: Date.now() });
      }
      window.localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore broadcast errors
    }
  }, [fetchAllConsortiumData]);

  useEffect(() => {
    fetch('/api/auth/participants')
      .then((res) => res.json())
      .then((data) => {
        if (data.participants) setParticipants(data.participants);
      })
      .catch(() => {});

    fetchAllConsortiumData();

    // Set up cross-tab BroadcastChannel + storage listener so all 6 open tabs stay in live sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.onmessage = () => {
          fetchAllConsortiumData();
        };
        channelRef.current = bc;
      } catch {
        // ignore
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SYNC_STORAGE_KEY) {
        fetchAllConsortiumData();
      }
    };

    const handlePopState = () => {
      const sessionSaved = window.sessionStorage.getItem(SESSION_ROLE_KEY);
      const nextRole = resolveActiveRole(window.location.search, sessionSaved);
      setActiveRole(nextRole);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('popstate', handlePopState);
    const interval = setInterval(fetchAllConsortiumData, 3500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [fetchAllConsortiumData]);

  const switchRole = useCallback(
    (rawRole: RoleId | string) => {
      const resolved = resolveActiveRole(`?role=${rawRole}`, null);
      setActiveRole(resolved);
      try {
        window.sessionStorage.setItem(SESSION_ROLE_KEY, resolved);
        const url = new URL(window.location.href);
        url.searchParams.set('role', resolved);
        if (resolved !== 'customer' && url.pathname.startsWith('/verify')) {
          url.pathname = '/';
        }
        window.history.pushState({}, '', url.toString());
      } catch {
        // ignore URL update errors
      }
      fetchAllConsortiumData();
    },
    [fetchAllConsortiumData]
  );

  const currentUser = getRoleService(activeRole);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        demoUsers: ROLE_SERVICES,
        participants,
        organs,
        investigations,
        investigationCount: investigations.length,
        loading,
        lastSyncedAt,
        refreshStats: fetchAllConsortiumData,
        broadcastSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
