export type CollectionStatusKey =
  | "pending"
  | "entered"
  | "submitted"
  | "acknowledged"
  | "overdue";

export const STATUS_CONFIG: Record<
  CollectionStatusKey,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "#fffbeb", text: "#b45309" },
  entered: { label: "Entered", bg: "#eff6ff", text: "#1d4ed8" },
  submitted: { label: "Submitted", bg: "#f5f3ff", text: "#6d28d9" },
  acknowledged: { label: "Acknowledged", bg: "#ecfdf5", text: "#047857" },
  overdue: { label: "Overdue", bg: "#fef2f2", text: "#b91c1c" },
};

export const USER_STATUS_CONFIG: Record<
  "active" | "inactive",
  { label: string; bg: string; text: string }
> = {
  active: { label: "Active", bg: "#ecfdf5", text: "#047857" },
  inactive: { label: "Inactive", bg: "#f1f5f9", text: "#64748b" },
};

export const PARLOR_TYPE_CONFIG: Record<string, { bg: string; text: string }> = {
  Mall: { bg: "#dbeafe", text: "#1d4ed8" },
  Standalone: { bg: "#f1f5f9", text: "#475569" },
  Event: { bg: "#ffedd5", text: "#c2410c" },
  Kiosk: { bg: "#ede9fe", text: "#6d28d9" },
};
