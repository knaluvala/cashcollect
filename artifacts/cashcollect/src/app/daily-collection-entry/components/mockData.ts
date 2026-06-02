export type ParlorType = 'Mall' | 'Standalone' | 'Event' | 'Kiosk';
export type CollectionStatus =
  | 'pending' |'entered' |'submitted' |'acknowledged';

export interface ParlorEntry {
  id: string;
  parlorCode: string;
  parlorName: string;
  parlorType: ParlorType;
  routeCode: string;
  agentCode: string;
  agentName: string;
  status: CollectionStatus;
  cashAmount: number | null;
  couponAmount: number | null;
  ccAmount: number | null;
  notes: string;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

export interface SupervisorPendingItem {
  id: string;
  agentName: string;
  agentCode: string;
  routeCode: string;
  parlorCode: string;
  parlorName: string;
  parlorType: ParlorType;
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  submittedAt: string;
  status: 'submitted' | 'acknowledged';
}

// ── Per-agent parlor lists ──────────────────────────────────────────────────

export const AGENT_PARLORS: Record<string, ParlorEntry[]> = {
  'AGT-042': [
    // Rajan Kumar · RT-04
    { id: 'e042-001', parlorCode: 'PRL-001', parlorName: 'Nexus Mall — Koramangala', parlorType: 'Mall', routeCode: 'RT-04', agentCode: 'AGT-042', agentName: 'Rajan Kumar', status: 'acknowledged', cashAmount: 12450, couponAmount: 3200, ccAmount: 18900, notes: 'POS terminal slow, manual CC slip attached', submittedAt: '08/05/2026 09:42', acknowledgedAt: '08/05/2026 11:15', acknowledgedBy: 'Meena Sharma' },
    { id: 'e042-002', parlorCode: 'PRL-007', parlorName: 'Forum Value Mall', parlorType: 'Mall', routeCode: 'RT-04', agentCode: 'AGT-042', agentName: 'Rajan Kumar', status: 'submitted', cashAmount: 8750, couponAmount: 1500, ccAmount: 22100, notes: '', submittedAt: '08/05/2026 10:18', acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e042-003', parlorCode: 'PRL-012', parlorName: 'Indiranagar 100ft Road', parlorType: 'Standalone', routeCode: 'RT-04', agentCode: 'AGT-042', agentName: 'Rajan Kumar', status: 'entered', cashAmount: 6320, couponAmount: 800, ccAmount: 9450, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e042-004', parlorCode: 'PRL-019', parlorName: 'Jayanagar 4th Block', parlorType: 'Standalone', routeCode: 'RT-04', agentCode: 'AGT-042', agentName: 'Rajan Kumar', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
  ],
  'AGT-038': [
    // Priya Nair · RT-04
    { id: 'e038-001', parlorCode: 'PRL-023', parlorName: 'Phoenix Marketcity', parlorType: 'Mall', routeCode: 'RT-04', agentCode: 'AGT-038', agentName: 'Priya Nair', status: 'submitted', cashAmount: 9800, couponAmount: 2100, ccAmount: 17500, notes: '', submittedAt: '08/05/2026 10:55', acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e038-002', parlorCode: 'PRL-031', parlorName: 'Whitefield ITPL Gate', parlorType: 'Event', routeCode: 'RT-04', agentCode: 'AGT-038', agentName: 'Priya Nair', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e038-003', parlorCode: 'PRL-062', parlorName: 'Electronic City Phase 1', parlorType: 'Standalone', routeCode: 'RT-04', agentCode: 'AGT-038', agentName: 'Priya Nair', status: 'submitted', cashAmount: 11200, couponAmount: 2800, ccAmount: 15600, notes: '', submittedAt: '08/05/2026 10:45', acknowledgedAt: null, acknowledgedBy: null },
  ],
  'AGT-029': [
    // Anita Desai · RT-04
    { id: 'e029-001', parlorCode: 'PRL-038', parlorName: 'HSR Layout Sector 2', parlorType: 'Standalone', routeCode: 'RT-04', agentCode: 'AGT-029', agentName: 'Anita Desai', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e029-002', parlorCode: 'PRL-083', parlorName: 'Bannerghatta Road Mall', parlorType: 'Mall', routeCode: 'RT-04', agentCode: 'AGT-029', agentName: 'Anita Desai', status: 'submitted', cashAmount: 14300, couponAmount: 4100, ccAmount: 27800, notes: '', submittedAt: '08/05/2026 11:30', acknowledgedAt: null, acknowledgedBy: null },
  ],
  'AGT-051': [
    // Suresh Babu · RT-05
    { id: 'e051-001', parlorCode: 'PRL-044', parlorName: 'Koramangala 5th Block Kiosk', parlorType: 'Kiosk', routeCode: 'RT-05', agentCode: 'AGT-051', agentName: 'Suresh Babu', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e051-002', parlorCode: 'PRL-074', parlorName: 'Sarjapur Road Outlet', parlorType: 'Standalone', routeCode: 'RT-05', agentCode: 'AGT-051', agentName: 'Suresh Babu', status: 'submitted', cashAmount: 5400, couponAmount: 600, ccAmount: 8900, notes: '', submittedAt: '08/05/2026 11:02', acknowledgedAt: null, acknowledgedBy: null },
  ],
  'AGT-063': [
    // Vikram Singh · RT-06
    { id: 'e063-001', parlorCode: 'PRL-057', parlorName: 'Marathahalli Bridge', parlorType: 'Kiosk', routeCode: 'RT-06', agentCode: 'AGT-063', agentName: 'Vikram Singh', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
    { id: 'e063-002', parlorCode: 'PRL-068', parlorName: 'MG Road Premium', parlorType: 'Standalone', routeCode: 'RT-06', agentCode: 'AGT-063', agentName: 'Vikram Singh', status: 'entered', cashAmount: 7600, couponAmount: 1200, ccAmount: 11400, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
  ],
  'AGT-071': [
    // Kavitha Menon · RT-07
    { id: 'e071-001', parlorCode: 'PRL-089', parlorName: 'Hebbal Lake View', parlorType: 'Standalone', routeCode: 'RT-07', agentCode: 'AGT-071', agentName: 'Kavitha Menon', status: 'pending', cashAmount: null, couponAmount: null, ccAmount: null, notes: '', submittedAt: null, acknowledgedAt: null, acknowledgedBy: null },
  ],
};

// ── Supervisor → agent code mappings ──────────────────────────────────────

export const SUPERVISOR_AGENTS: Record<string, string[]> = {
  'SUP-012': ['AGT-042', 'AGT-038', 'AGT-029', 'AGT-051'], // Meena Sharma
  'SUP-017': ['AGT-063', 'AGT-071'],                        // Deepa Rao
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** All parlors from every agent — used by Super Admin */
export const ALL_AGENT_PARLORS: ParlorEntry[] = Object.values(AGENT_PARLORS).flat();

/**
 * Returns the parlor list scoped to the logged-in user:
 * - agent     → only their own parlors
 * - supervisor → parlors of all agents under them
 * - superadmin → every parlor
 */
export function getScopedParlors(
  role: 'agent' | 'supervisor' | 'superadmin',
  agentCode?: string,
  supervisorCode?: string
): ParlorEntry[] {
  if (role === 'agent' && agentCode) {
    return AGENT_PARLORS[agentCode] ?? [];
  }
  if (role === 'supervisor' && supervisorCode) {
    const codes = SUPERVISOR_AGENTS[supervisorCode] ?? [];
    return codes.flatMap((code) => AGENT_PARLORS[code] ?? []);
  }
  return ALL_AGENT_PARLORS;
}

// ── Legacy alias (kept for existing imports) ──────────────────────────────
export const MOCK_PARLORS: ParlorEntry[] = AGENT_PARLORS['AGT-042'];

export const SUPERVISOR_PENDING: SupervisorPendingItem[] = [
  { id: 'sup-001', agentName: 'Rajan Kumar', agentCode: 'AGT-042', routeCode: 'RT-04', parlorCode: 'PRL-007', parlorName: 'Forum Value Mall', parlorType: 'Mall', cashAmount: 8750, couponAmount: 1500, ccAmount: 22100, submittedAt: '08/05/2026 10:18', status: 'submitted' },
  { id: 'sup-002', agentName: 'Priya Nair', agentCode: 'AGT-038', routeCode: 'RT-04', parlorCode: 'PRL-062', parlorName: 'Electronic City Phase 1', parlorType: 'Standalone', cashAmount: 11200, couponAmount: 2800, ccAmount: 15600, submittedAt: '08/05/2026 10:45', status: 'submitted' },
  { id: 'sup-003', agentName: 'Suresh Babu', agentCode: 'AGT-051', routeCode: 'RT-05', parlorCode: 'PRL-074', parlorName: 'Sarjapur Road Outlet', parlorType: 'Standalone', cashAmount: 5400, couponAmount: 600, ccAmount: 8900, submittedAt: '08/05/2026 11:02', status: 'submitted' },
  { id: 'sup-004', agentName: 'Anita Desai', agentCode: 'AGT-029', routeCode: 'RT-04', parlorCode: 'PRL-083', parlorName: 'Bannerghatta Road Mall', parlorType: 'Mall', cashAmount: 14300, couponAmount: 4100, ccAmount: 27800, submittedAt: '08/05/2026 11:30', status: 'submitted' },
  { id: 'sup-005', agentName: 'Priya Nair', agentCode: 'AGT-038', routeCode: 'RT-04', parlorCode: 'PRL-023', parlorName: 'Phoenix Marketcity', parlorType: 'Mall', cashAmount: 9800, couponAmount: 2100, ccAmount: 17500, submittedAt: '08/05/2026 10:55', status: 'submitted' },
];
