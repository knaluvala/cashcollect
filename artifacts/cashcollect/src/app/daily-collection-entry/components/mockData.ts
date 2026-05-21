export type ParlorType = 'Mall' | 'Standalone' | 'Event' | 'Kiosk';
export type CollectionStatus =
  | 'pending' |'entered' |'submitted' |'acknowledged';

export interface ParlorEntry {
  id: string;
  parlorCode: string;
  parlorName: string;
  parlorType: ParlorType;
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

export const MOCK_PARLORS: ParlorEntry[] = [
  {
    id: 'entry-001',
    parlorCode: 'PRL-001',
    parlorName: 'Nexus Mall — Koramangala',
    parlorType: 'Mall',
    status: 'acknowledged',
    cashAmount: 12450,
    couponAmount: 3200,
    ccAmount: 18900,
    notes: 'POS terminal slow, manual CC slip attached',
    submittedAt: '08/05/2026 09:42',
    acknowledgedAt: '08/05/2026 11:15',
    acknowledgedBy: 'Meena Sharma',
  },
  {
    id: 'entry-002',
    parlorCode: 'PRL-007',
    parlorName: 'Forum Value Mall',
    parlorType: 'Mall',
    status: 'submitted',
    cashAmount: 8750,
    couponAmount: 1500,
    ccAmount: 22100,
    notes: '',
    submittedAt: '08/05/2026 10:18',
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-003',
    parlorCode: 'PRL-012',
    parlorName: 'Indiranagar 100ft Road',
    parlorType: 'Standalone',
    status: 'entered',
    cashAmount: 6320,
    couponAmount: 800,
    ccAmount: 9450,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-004',
    parlorCode: 'PRL-019',
    parlorName: 'Jayanagar 4th Block',
    parlorType: 'Standalone',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-005',
    parlorCode: 'PRL-023',
    parlorName: 'Phoenix Marketcity',
    parlorType: 'Mall',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-006',
    parlorCode: 'PRL-031',
    parlorName: 'Whitefield ITPL Gate',
    parlorType: 'Event',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-007',
    parlorCode: 'PRL-038',
    parlorName: 'HSR Layout Sector 2',
    parlorType: 'Standalone',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-008',
    parlorCode: 'PRL-044',
    parlorName: 'Koramangala 5th Block Kiosk',
    parlorType: 'Kiosk',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-009',
    parlorCode: 'PRL-051',
    parlorName: 'BTM Layout 2nd Stage',
    parlorType: 'Standalone',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'entry-010',
    parlorCode: 'PRL-057',
    parlorName: 'Marathahalli Bridge',
    parlorType: 'Kiosk',
    status: 'pending',
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: '',
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
];

export const SUPERVISOR_PENDING: SupervisorPendingItem[] = [
  {
    id: 'sup-001',
    agentName: 'Rajan Kumar',
    agentCode: 'AGT-042',
    routeCode: 'RT-04',
    parlorCode: 'PRL-007',
    parlorName: 'Forum Value Mall',
    parlorType: 'Mall',
    cashAmount: 8750,
    couponAmount: 1500,
    ccAmount: 22100,
    submittedAt: '08/05/2026 10:18',
    status: 'submitted',
  },
  {
    id: 'sup-002',
    agentName: 'Priya Nair',
    agentCode: 'AGT-038',
    routeCode: 'RT-04',
    parlorCode: 'PRL-062',
    parlorName: 'Electronic City Phase 1',
    parlorType: 'Standalone',
    cashAmount: 11200,
    couponAmount: 2800,
    ccAmount: 15600,
    submittedAt: '08/05/2026 10:45',
    status: 'submitted',
  },
  {
    id: 'sup-003',
    agentName: 'Suresh Babu',
    agentCode: 'AGT-051',
    routeCode: 'RT-05',
    parlorCode: 'PRL-074',
    parlorName: 'Sarjapur Road Outlet',
    parlorType: 'Standalone',
    cashAmount: 5400,
    couponAmount: 600,
    ccAmount: 8900,
    submittedAt: '08/05/2026 11:02',
    status: 'submitted',
  },
  {
    id: 'sup-004',
    agentName: 'Anita Desai',
    agentCode: 'AGT-029',
    routeCode: 'RT-04',
    parlorCode: 'PRL-083',
    parlorName: 'Bannerghatta Road Mall',
    parlorType: 'Mall',
    cashAmount: 14300,
    couponAmount: 4100,
    ccAmount: 27800,
    submittedAt: '08/05/2026 11:30',
    status: 'submitted',
  },
];