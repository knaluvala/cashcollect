import { UserRole } from "@/context/AuthContext";

export type Permission =
  | "collection:view"
  | "collection:create"
  | "collection:acknowledge"
  | "reports:view"
  | "route-master:view"
  | "user-management:view"
  | "parlor-master:view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  agent: ["collection:view", "collection:create", "reports:view"],
  supervisor: [
    "collection:view",
    "collection:create",
    "collection:acknowledge",
    "reports:view",
  ],
  superadmin: [
    "collection:view",
    "reports:view",
    "route-master:view",
    "user-management:view",
    "parlor-master:view",
  ],
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}