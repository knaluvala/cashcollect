export type CollectionStatus =
  | "pending"
  | "entered"
  | "submitted"
  | "acknowledged";

export type ParlorEntry = {
  id: string;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  routeCode?: string;
  agentCode?: string;
  agentName?: string;
  supervisorName?: string;
  date?: string;
  status: CollectionStatus;
  cashAmount: number | null;
  couponAmount: number | null;
  ccAmount: number | null;
  notes?: string;
  submittedAt?: string | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
};

export type SupervisorPendingItem = ParlorEntry;

export function formatAED(value: number) {
  return `AED ${Number(value || 0).toLocaleString("en-AE")}`;
}
