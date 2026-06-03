export interface DetailedReportRow {
  id: string;
  date: string;
  parlorCode: string;
  parlorName: string;
  parlorType: 'Mall' | 'Standalone' | 'Event' | 'Kiosk';
  routeCode: string;
  agentCode: string;
  agentName: string;
  supervisorCode: string;
  supervisorName: string;
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  total: number;
  status: 'entered' | 'submitted' | 'acknowledged';
}

export interface SummaryReportRow {
  id: string;
  agentCode: string;
  agentName: string;
  routeCode: string;
  supervisorCode: string;
  supervisorName: string;
  parlorCount: number;
  totalCash: number;
  totalCoupon: number;
  totalCC: number;
  grandTotal: number;
  acknowledgedCount: number;
  pendingCount: number;
}

export const COLLECTORS = [
  { code: 'AGT-042', name: 'Rajan Kumar' },
  { code: 'AGT-038', name: 'Priya Nair' },
  { code: 'AGT-051', name: 'Suresh Babu' },
  { code: 'AGT-029', name: 'Anita Desai' },
  { code: 'AGT-063', name: 'Vikram Singh' },
  { code: 'AGT-071', name: 'Kavitha Menon' },
];

export const PARLORS_FILTER = [
  { code: 'PRL-001', name: 'Nexus Mall — Koramangala' },
  { code: 'PRL-007', name: 'Forum Value Mall' },
  { code: 'PRL-019', name: 'Jayanagar 4th Block' },
  { code: 'PRL-031', name: 'Whitefield ITPL Gate' },
  { code: 'PRL-044', name: 'Koramangala 5th Block Kiosk' },
  { code: 'PRL-057', name: 'Marathahalli Bridge' },
  { code: 'PRL-062', name: 'Electronic City Phase 1' },
  { code: 'PRL-068', name: 'MG Road Premium' },
  { code: 'PRL-074', name: 'Sarjapur Road Outlet' },
  { code: 'PRL-083', name: 'Bannerghatta Road Mall' },
  { code: 'PRL-089', name: 'Hebbal Lake View' },
];

export const AGENT_SUPERVISOR_MAP: Record<string, { code: string; name: string }> = {
  'AGT-042': { code: 'SUP-012', name: 'Meena Sharma' },
  'AGT-038': { code: 'SUP-012', name: 'Meena Sharma' },
  'AGT-029': { code: 'SUP-012', name: 'Meena Sharma' },
  'AGT-051': { code: 'SUP-012', name: 'Meena Sharma' },
  'AGT-063': { code: 'SUP-017', name: 'Deepa Rao' },
  'AGT-071': { code: 'SUP-017', name: 'Deepa Rao' },
};

export function getAgentSupervisor(agentCode: string) {
  return AGENT_SUPERVISOR_MAP[agentCode] ?? { code: 'SUP-012', name: 'Meena Sharma' };
}
