export interface Parlor {
  code: string;
  name: string;
  type: 'Mall' | 'Standalone' | 'Event' | 'Kiosk';
}

export interface Route {
  id: string;
  routeCode: string;
  description: string;
  assignedAgent: string;
  agentCode: string;
  supervisorName: string;
  supervisorCode: string;
  parlors: Parlor[];
}

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'rt-04',
    routeCode: 'RT-04',
    description: 'South Bengaluru — Koramangala & JP Nagar',
    assignedAgent: 'Rajan Kumar',
    agentCode: 'AGT-042',
    supervisorName: 'Meena Sharma',
    supervisorCode: 'SUP-012',
    parlors: [
      { code: 'PRL-001', name: 'Nexus Mall — Koramangala', type: 'Mall' },
      { code: 'PRL-007', name: 'Forum Value Mall', type: 'Mall' },
      { code: 'PRL-012', name: 'Indiranagar 100ft Road', type: 'Standalone' },
      { code: 'PRL-019', name: 'Jayanagar 4th Block', type: 'Standalone' },
      { code: 'PRL-023', name: 'Phoenix Marketcity', type: 'Mall' },
      { code: 'PRL-031', name: 'Whitefield ITPL Gate', type: 'Event' },
      { code: 'PRL-062', name: 'Electronic City Phase 1', type: 'Standalone' },
      { code: 'PRL-083', name: 'Bannerghatta Road Mall', type: 'Mall' },
    ],
  },
  {
    id: 'rt-05',
    routeCode: 'RT-05',
    description: 'East Bengaluru — Whitefield & Sarjapur',
    assignedAgent: 'Suresh Babu',
    agentCode: 'AGT-051',
    supervisorName: 'Meena Sharma',
    supervisorCode: 'SUP-012',
    parlors: [
      { code: 'PRL-044', name: 'Koramangala 5th Block Kiosk', type: 'Kiosk' },
      { code: 'PRL-074', name: 'Sarjapur Road Outlet', type: 'Standalone' },
    ],
  },
  {
    id: 'rt-06',
    routeCode: 'RT-06',
    description: 'Central Bengaluru — MG Road & Marathahalli',
    assignedAgent: 'Vikram Singh',
    agentCode: 'AGT-063',
    supervisorName: 'Deepa Rao',
    supervisorCode: 'SUP-017',
    parlors: [
      { code: 'PRL-057', name: 'Marathahalli Bridge', type: 'Kiosk' },
      { code: 'PRL-068', name: 'MG Road Premium', type: 'Standalone' },
    ],
  },
  {
    id: 'rt-07',
    routeCode: 'RT-07',
    description: 'North Bengaluru — Hebbal & Yelahanka',
    assignedAgent: 'Kavitha Menon',
    agentCode: 'AGT-071',
    supervisorName: 'Deepa Rao',
    supervisorCode: 'SUP-017',
    parlors: [
      { code: 'PRL-089', name: 'Hebbal Lake View', type: 'Standalone' },
    ],
  },
];

export const ALL_PARLORS: Parlor[] = [
  { code: 'PRL-001', name: 'Nexus Mall — Koramangala', type: 'Mall' },
  { code: 'PRL-007', name: 'Forum Value Mall', type: 'Mall' },
  { code: 'PRL-012', name: 'Indiranagar 100ft Road', type: 'Standalone' },
  { code: 'PRL-019', name: 'Jayanagar 4th Block', type: 'Standalone' },
  { code: 'PRL-023', name: 'Phoenix Marketcity', type: 'Mall' },
  { code: 'PRL-031', name: 'Whitefield ITPL Gate', type: 'Event' },
  { code: 'PRL-044', name: 'Koramangala 5th Block Kiosk', type: 'Kiosk' },
  { code: 'PRL-057', name: 'Marathahalli Bridge', type: 'Kiosk' },
  { code: 'PRL-062', name: 'Electronic City Phase 1', type: 'Standalone' },
  { code: 'PRL-068', name: 'MG Road Premium', type: 'Standalone' },
  { code: 'PRL-074', name: 'Sarjapur Road Outlet', type: 'Standalone' },
  { code: 'PRL-083', name: 'Bannerghatta Road Mall', type: 'Mall' },
  { code: 'PRL-089', name: 'Hebbal Lake View', type: 'Standalone' },
  { code: 'PRL-094', name: 'Indiranagar CMH Road', type: 'Standalone' },
  { code: 'PRL-098', name: 'HSR Layout Sector 7', type: 'Standalone' },
  { code: 'PRL-102', name: 'Yelahanka New Town', type: 'Standalone' },
];
