export type ParlorType = "Mall" | "Standalone" | "Event" | "Kiosk";
export type CollectionStatus = "pending" | "entered" | "submitted" | "acknowledged";

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
  status: "submitted" | "acknowledged";
}

export interface DetailedReportRow {
  id: string;
  date: string;
  parlorCode: string;
  parlorName: string;
  parlorType: ParlorType;
  routeCode: string;
  agentCode: string;
  agentName: string;
  supervisorCode: string;
  supervisorName: string;
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  total: number;
  status: "submitted" | "acknowledged";
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

export const MOCK_PARLORS: ParlorEntry[] = [
  {
    id: "entry-001",
    parlorCode: "PRL-001",
    parlorName: "Nexus Mall — Koramangala",
    parlorType: "Mall",
    status: "acknowledged",
    cashAmount: 12450,
    couponAmount: 3200,
    ccAmount: 18900,
    notes: "POS terminal slow, manual CC slip attached",
    submittedAt: "08/05/2026 09:42",
    acknowledgedAt: "08/05/2026 11:15",
    acknowledgedBy: "Meena Sharma",
  },
  {
    id: "entry-002",
    parlorCode: "PRL-007",
    parlorName: "Forum Value Mall",
    parlorType: "Mall",
    status: "submitted",
    cashAmount: 8750,
    couponAmount: 1500,
    ccAmount: 22100,
    notes: "",
    submittedAt: "08/05/2026 10:18",
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-003",
    parlorCode: "PRL-012",
    parlorName: "Indiranagar 100ft Road",
    parlorType: "Standalone",
    status: "entered",
    cashAmount: 6320,
    couponAmount: 800,
    ccAmount: 9450,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-004",
    parlorCode: "PRL-019",
    parlorName: "Jayanagar 4th Block",
    parlorType: "Standalone",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-005",
    parlorCode: "PRL-023",
    parlorName: "Phoenix Marketcity",
    parlorType: "Mall",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-006",
    parlorCode: "PRL-031",
    parlorName: "Whitefield ITPL Gate",
    parlorType: "Event",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-007",
    parlorCode: "PRL-038",
    parlorName: "HSR Layout Sector 2",
    parlorType: "Standalone",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-008",
    parlorCode: "PRL-044",
    parlorName: "Koramangala 5th Block Kiosk",
    parlorType: "Kiosk",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-009",
    parlorCode: "PRL-051",
    parlorName: "BTM Layout 2nd Stage",
    parlorType: "Standalone",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: "entry-010",
    parlorCode: "PRL-057",
    parlorName: "Marathahalli Bridge",
    parlorType: "Kiosk",
    status: "pending",
    cashAmount: null,
    couponAmount: null,
    ccAmount: null,
    notes: "",
    submittedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
];

export const SUPERVISOR_PENDING: SupervisorPendingItem[] = [
  {
    id: "sup-001",
    agentName: "Rajan Kumar",
    agentCode: "AGT-042",
    routeCode: "RT-04",
    parlorCode: "PRL-007",
    parlorName: "Forum Value Mall",
    parlorType: "Mall",
    cashAmount: 8750,
    couponAmount: 1500,
    ccAmount: 22100,
    submittedAt: "08/05/2026 10:18",
    status: "submitted",
  },
  {
    id: "sup-002",
    agentName: "Priya Nair",
    agentCode: "AGT-038",
    routeCode: "RT-04",
    parlorCode: "PRL-062",
    parlorName: "Electronic City Phase 1",
    parlorType: "Standalone",
    cashAmount: 11200,
    couponAmount: 2800,
    ccAmount: 15600,
    submittedAt: "08/05/2026 10:45",
    status: "submitted",
  },
  {
    id: "sup-003",
    agentName: "Suresh Babu",
    agentCode: "AGT-051",
    routeCode: "RT-05",
    parlorCode: "PRL-074",
    parlorName: "Sarjapur Road Outlet",
    parlorType: "Standalone",
    cashAmount: 5400,
    couponAmount: 600,
    ccAmount: 8900,
    submittedAt: "08/05/2026 11:02",
    status: "submitted",
  },
  {
    id: "sup-004",
    agentName: "Anita Desai",
    agentCode: "AGT-029",
    routeCode: "RT-04",
    parlorCode: "PRL-083",
    parlorName: "Bannerghatta Road Mall",
    parlorType: "Mall",
    cashAmount: 14300,
    couponAmount: 4100,
    ccAmount: 27800,
    submittedAt: "08/05/2026 11:30",
    status: "submitted",
  },
];

export const DETAILED_REPORT_DATA: DetailedReportRow[] = [
  {
    id: "det-001",
    date: "08/05/2026",
    parlorCode: "PRL-001",
    parlorName: "Nexus Mall — Koramangala",
    parlorType: "Mall",
    routeCode: "RT-04",
    agentCode: "AGT-042",
    agentName: "Rajan Kumar",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 12450,
    couponAmount: 3200,
    ccAmount: 18900,
    total: 34550,
    status: "acknowledged",
  },
  {
    id: "det-002",
    date: "08/05/2026",
    parlorCode: "PRL-007",
    parlorName: "Forum Value Mall",
    parlorType: "Mall",
    routeCode: "RT-04",
    agentCode: "AGT-042",
    agentName: "Rajan Kumar",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 8750,
    couponAmount: 1500,
    ccAmount: 22100,
    total: 32350,
    status: "submitted",
  },
  {
    id: "det-003",
    date: "08/05/2026",
    parlorCode: "PRL-062",
    parlorName: "Electronic City Phase 1",
    parlorType: "Standalone",
    routeCode: "RT-04",
    agentCode: "AGT-038",
    agentName: "Priya Nair",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 11200,
    couponAmount: 2800,
    ccAmount: 15600,
    total: 29600,
    status: "submitted",
  },
  {
    id: "det-004",
    date: "08/05/2026",
    parlorCode: "PRL-074",
    parlorName: "Sarjapur Road Outlet",
    parlorType: "Standalone",
    routeCode: "RT-05",
    agentCode: "AGT-051",
    agentName: "Suresh Babu",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 5400,
    couponAmount: 600,
    ccAmount: 8900,
    total: 14900,
    status: "submitted",
  },
  {
    id: "det-005",
    date: "08/05/2026",
    parlorCode: "PRL-083",
    parlorName: "Bannerghatta Road Mall",
    parlorType: "Mall",
    routeCode: "RT-04",
    agentCode: "AGT-029",
    agentName: "Anita Desai",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 14300,
    couponAmount: 4100,
    ccAmount: 27800,
    total: 46200,
    status: "submitted",
  },
  {
    id: "det-006",
    date: "07/05/2026",
    parlorCode: "PRL-001",
    parlorName: "Nexus Mall — Koramangala",
    parlorType: "Mall",
    routeCode: "RT-04",
    agentCode: "AGT-042",
    agentName: "Rajan Kumar",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 10200,
    couponAmount: 2700,
    ccAmount: 16400,
    total: 29300,
    status: "acknowledged",
  },
  {
    id: "det-007",
    date: "07/05/2026",
    parlorCode: "PRL-019",
    parlorName: "Jayanagar 4th Block",
    parlorType: "Standalone",
    routeCode: "RT-04",
    agentCode: "AGT-042",
    agentName: "Rajan Kumar",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 4800,
    couponAmount: 900,
    ccAmount: 7200,
    total: 12900,
    status: "acknowledged",
  },
  {
    id: "det-008",
    date: "07/05/2026",
    parlorCode: "PRL-031",
    parlorName: "Whitefield ITPL Gate",
    parlorType: "Event",
    routeCode: "RT-04",
    agentCode: "AGT-038",
    agentName: "Priya Nair",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 18600,
    couponAmount: 5200,
    ccAmount: 31400,
    total: 55200,
    status: "acknowledged",
  },
  {
    id: "det-009",
    date: "07/05/2026",
    parlorCode: "PRL-044",
    parlorName: "Koramangala 5th Block Kiosk",
    parlorType: "Kiosk",
    routeCode: "RT-05",
    agentCode: "AGT-051",
    agentName: "Suresh Babu",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    cashAmount: 3200,
    couponAmount: 400,
    ccAmount: 5600,
    total: 9200,
    status: "acknowledged",
  },
  {
    id: "det-010",
    date: "06/05/2026",
    parlorCode: "PRL-057",
    parlorName: "Marathahalli Bridge",
    parlorType: "Kiosk",
    routeCode: "RT-06",
    agentCode: "AGT-063",
    agentName: "Vikram Singh",
    supervisorCode: "SUP-017",
    supervisorName: "Deepa Rao",
    cashAmount: 2900,
    couponAmount: 350,
    ccAmount: 4800,
    total: 8050,
    status: "acknowledged",
  },
  {
    id: "det-011",
    date: "06/05/2026",
    parlorCode: "PRL-068",
    parlorName: "MG Road Premium",
    parlorType: "Standalone",
    routeCode: "RT-06",
    agentCode: "AGT-063",
    agentName: "Vikram Singh",
    supervisorCode: "SUP-017",
    supervisorName: "Deepa Rao",
    cashAmount: 9800,
    couponAmount: 2100,
    ccAmount: 14300,
    total: 26200,
    status: "acknowledged",
  },
  {
    id: "det-012",
    date: "06/05/2026",
    parlorCode: "PRL-089",
    parlorName: "Hebbal Lake View",
    parlorType: "Standalone",
    routeCode: "RT-07",
    agentCode: "AGT-071",
    agentName: "Kavitha Menon",
    supervisorCode: "SUP-017",
    supervisorName: "Deepa Rao",
    cashAmount: 7400,
    couponAmount: 1600,
    ccAmount: 11200,
    total: 20200,
    status: "acknowledged",
  },
];

export const SUMMARY_REPORT_DATA: SummaryReportRow[] = [
  {
    id: "sum-001",
    agentCode: "AGT-042",
    agentName: "Rajan Kumar",
    routeCode: "RT-04",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    parlorCount: 4,
    totalCash: 36200,
    totalCoupon: 8300,
    totalCC: 64600,
    grandTotal: 109100,
    acknowledgedCount: 3,
    pendingCount: 1,
  },
  {
    id: "sum-002",
    agentCode: "AGT-038",
    agentName: "Priya Nair",
    routeCode: "RT-04",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    parlorCount: 3,
    totalCash: 40600,
    totalCoupon: 10800,
    totalCC: 62400,
    grandTotal: 113800,
    acknowledgedCount: 2,
    pendingCount: 1,
  },
  {
    id: "sum-003",
    agentCode: "AGT-051",
    agentName: "Suresh Babu",
    routeCode: "RT-05",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    parlorCount: 3,
    totalCash: 14000,
    totalCoupon: 1600,
    totalCC: 23300,
    grandTotal: 38900,
    acknowledgedCount: 2,
    pendingCount: 1,
  },
  {
    id: "sum-004",
    agentCode: "AGT-029",
    agentName: "Anita Desai",
    routeCode: "RT-04",
    supervisorCode: "SUP-012",
    supervisorName: "Meena Sharma",
    parlorCount: 2,
    totalCash: 22100,
    totalCoupon: 5900,
    totalCC: 41200,
    grandTotal: 69200,
    acknowledgedCount: 1,
    pendingCount: 1,
  },
  {
    id: "sum-005",
    agentCode: "AGT-063",
    agentName: "Vikram Singh",
    routeCode: "RT-06",
    supervisorCode: "SUP-017",
    supervisorName: "Deepa Rao",
    parlorCount: 5,
    totalCash: 28400,
    totalCoupon: 6200,
    totalCC: 42800,
    grandTotal: 77400,
    acknowledgedCount: 5,
    pendingCount: 0,
  },
  {
    id: "sum-006",
    agentCode: "AGT-071",
    agentName: "Kavitha Menon",
    routeCode: "RT-07",
    supervisorCode: "SUP-017",
    supervisorName: "Deepa Rao",
    parlorCount: 4,
    totalCash: 21600,
    totalCoupon: 4800,
    totalCC: 33700,
    grandTotal: 60100,
    acknowledgedCount: 4,
    pendingCount: 0,
  },
];

export const COLLECTORS = [
  { code: "AGT-042", name: "Rajan Kumar" },
  { code: "AGT-038", name: "Priya Nair" },
  { code: "AGT-051", name: "Suresh Babu" },
  { code: "AGT-029", name: "Anita Desai" },
  { code: "AGT-063", name: "Vikram Singh" },
  { code: "AGT-071", name: "Kavitha Menon" },
];

export const DEMO_ACCOUNTS = [
  {
    role: "agent" as const,
    label: "Collection Agent",
    email: "rajan.kumar@cashcollect.in",
    password: "Agent@2026",
    name: "Rajan Kumar",
    code: "AGT-042",
    route: "RT-04",
  },
  {
    role: "supervisor" as const,
    label: "Supervisor",
    email: "meena.sharma@cashcollect.in",
    password: "Super@2026",
    name: "Meena Sharma",
    code: "SUP-012",
    route: "RT-04",
  },
  {
    role: "superadmin" as const,
    label: "Super Admin",
    email: "admin@cashcollect.in",
    password: "Admin@2026",
    name: "Admin",
    code: "ADM-001",
    route: "",
  },
];

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}
