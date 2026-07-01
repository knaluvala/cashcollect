export type ParlorType = "Mall" | "Standalone" | "Event" | "Kiosk";

export type CollectionStatus =
  | "pending"
  | "entered"
  | "submitted"
  | "acknowledged";

export interface ParlorEntry {
  id: string;
  parlorCode: string;
  parlorName: string;
  parlorType: ParlorType;
  routeCode: string;
  agentCode: string;
  agentName: string;
  supervisorCode?: string;
  supervisorName?: string;
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
