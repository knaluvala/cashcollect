import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";

type UserRole = "agent" | "supervisor" | "superadmin";
type UserStatus = "active" | "inactive";

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  routeCode: string;
  agentCode: string;
  status: UserStatus;
};

export default function UserManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserRole>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | UserStatus>("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"agent" | "supervisor">("agent");
  const [formRouteCode, setFormRouteCode] = useState("");
  const [formAgentCode, setFormAgentCode] = useState("");
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function loadUsers() {
    if (!refreshing) {
      setLoading(true);
    }

    try {
      const res = await apiFetch(
        `/api/users?search=${encodeURIComponent(search)}`,
      );

      if (!res.ok) {
        throw new Error(`Users API failed: ${res.status}`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      Alert.alert(
        "Failed to load users",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  }

  function resetForm() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("agent");
    setFormRouteCode("");
    setFormAgentCode("");
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(user: AppUser) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role === "supervisor" ? "supervisor" : "agent");
    setFormRouteCode(user.routeCode);
    setFormAgentCode(user.agentCode);
    setShowForm(true);
  }

  async function saveUser() {
    if (!formName.trim()) {
      Alert.alert("Missing name", "Please enter the user's full name.");
      return;
    }

    if (!formEmail.trim()) {
      Alert.alert("Missing email", "Please enter the user's email.");
      return;
    }

    if (!formRouteCode.trim()) {
      Alert.alert("Missing route", "Please enter the route code.");
      return;
    }

    if (!formAgentCode.trim()) {
      Alert.alert("Missing code", "Please enter the user code.");
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        routeCode: formRouteCode.trim().toUpperCase(),
        agentCode: formAgentCode.trim().toUpperCase(),
        status: "active",
      };

      const res = await apiFetch(
        editingUser ? `/api/users/${editingUser.id}` : "/api/users",
        {
          method: editingUser ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Save user failed");
      }

      resetForm();
      setShowForm(false);
      await loadUsers();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function deleteUser(user: AppUser) {
    Alert.alert(
      "Delete user",
      `Delete ${user.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/users/${user.id}`, {
                method: "DELETE",
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.error || "Delete user failed");
              }

              await loadUsers();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error instanceof Error ? error.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  }

  async function toggleStatus(user: AppUser) {
    const newStatus: UserStatus =
      user.status === "active" ? "inactive" : "active";

    try {
      const res = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      await loadUsers();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Status update failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function submitPasswordReset() {
    if (!resetUser) return;

    if (resetPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please enter the same password in both fields.",
      );
      return;
    }

    try {
      const res = await apiFetch(`/api/users/${resetUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Success", `Password has been reset for ${resetUser.name}.`);

      setResetUser(null);
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((u) => {
        if (!q) return true;

        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.agentCode.toLowerCase().includes(q) ||
          u.routeCode.toLowerCase().includes(q)
        );
      })
      .filter((u) => filterRole === "all" || u.role === filterRole)
      .filter((u) => filterStatus === "all" || u.status === filterStatus);
  }, [users, search, filterRole, filterStatus]);

  const stats = {
    total: users.length,
    agents: users.filter((u) => u.role === "agent").length,
    supervisors: users.filter((u) => u.role === "supervisor").length,
    active: users.filter((u) => u.status === "active").length,
  };

  const s = makeStyles(colors, bottomPad);

  if (!hasPermission(user?.role, "user-management:view")) {
    return (
      <View style={s.container}>
        <View
          style={[
            s.headerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="lock" size={22} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.foreground }]}>
              Access Restricted
            </Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
              You do not have permission to access User Management.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View
        style={[
          s.headerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[s.iconBox, { backgroundColor: "#dbeafe" }]}>
          <Feather name="users" size={22} color="#1d4ed8" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>
            User Management
          </Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            Manage agents and supervisors
          </Text>
        </View>

        <TouchableOpacity
          style={[s.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.selectionAsync();
            openCreateForm();
          }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={s.newBtnText}>New</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.refreshBtn, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            handleRefresh();
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          s.statsRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <StatBox label="Users" value={stats.total.toString()} colors={colors} />
        <StatBox
          label="Agents"
          value={stats.agents.toString()}
          colors={colors}
        />
        <StatBox
          label="Sup."
          value={stats.supervisors.toString()}
          colors={colors}
        />
        <StatBox
          label="Active"
          value={stats.active.toString()}
          colors={colors}
        />
      </View>

      {showForm && (
        <View
          style={[
            s.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[s.formTitle, { color: colors.foreground }]}>
            {editingUser ? "Edit User" : "Create New User"}
          </Text>

          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Full Name"
            placeholderTextColor={colors.mutedForeground}
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            value={formEmail}
            onChangeText={setFormEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={s.filterRow}>
            {(["agent", "supervisor"] as const).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  s.filterChip,
                  {
                    backgroundColor:
                      formRole === role ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormRole(role)}
              >
                <Text
                  style={[
                    s.filterChipText,
                    { color: formRole === role ? "#fff" : colors.foreground },
                  ]}
                >
                  {role === "agent" ? "Agent" : "Supervisor"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Route Code"
            placeholderTextColor={colors.mutedForeground}
            value={formRouteCode}
            onChangeText={setFormRouteCode}
            autoCapitalize="characters"
          />
          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="User Code"
            placeholderTextColor={colors.mutedForeground}
            value={formAgentCode}
            onChangeText={setFormAgentCode}
            autoCapitalize="characters"
          />

          <View style={s.formActions}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              <Text style={[s.cancelBtnText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary }]}
              onPress={saveUser}
            >
              <Text style={s.saveBtnText}>
                {editingUser ? "Update" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View
        style={[
          s.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search name, email, code, route..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={s.filterRow}>
        {(["all", "agent", "supervisor"] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              s.filterChip,
              {
                backgroundColor:
                  filterRole === role ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilterRole(role)}
          >
            <Text
              style={[
                s.filterChipText,
                { color: filterRole === role ? "#fff" : colors.foreground },
              ]}
            >
              {role === "all"
                ? "All Roles"
                : role === "agent"
                  ? "Agents"
                  : "Supervisors"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.filterRow}>
        {(["all", "active", "inactive"] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              s.filterChip,
              {
                backgroundColor:
                  filterStatus === status ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                s.filterChipText,
                { color: filterStatus === status ? "#fff" : colors.foreground },
              ]}
            >
              {status === "all"
                ? "All Status"
                : status === "active"
                  ? "Active"
                  : "Inactive"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {resetUser && (
        <View
          style={[
            s.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[s.formTitle, { color: colors.foreground }]}>
            Reset Password — {resetUser.name}
          </Text>

          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="New Password"
            placeholderTextColor={colors.mutedForeground}
            value={resetPassword}
            onChangeText={setResetPassword}
            secureTextEntry
          />

          <TextInput
            style={[
              s.input,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.mutedForeground}
            value={resetConfirmPassword}
            onChangeText={setResetConfirmPassword}
            secureTextEntry
          />

          <View style={s.formActions}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                setResetUser(null);
                setResetPassword("");
                setResetConfirmPassword("");
              }}
            >
              <Text style={[s.cancelBtnText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary }]}
              onPress={submitPasswordReset}
            >
              <Text style={s.saveBtnText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={[s.sectionTitle, { color: colors.foreground }]}>
        Users ({filteredUsers.length})
      </Text>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
            Loading users...
          </Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View
          style={[
            s.emptyBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="user-x" size={30} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>
            No users found
          </Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Try changing your search or filters.
          </Text>
        </View>
      ) : (
        filteredUsers.map((user) => (
          <View
            key={user.id}
            style={[
              s.userCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={s.userTopRow}>
              <View style={[s.avatar, { backgroundColor: colors.primary }]}>
                <Text style={s.avatarText}>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.userName, { color: colors.foreground }]}>
                  {user.name}
                </Text>
                <Text style={[s.userEmail, { color: colors.mutedForeground }]}>
                  {user.email}
                </Text>
              </View>

              <View
                style={[
                  s.statusBadge,
                  {
                    backgroundColor:
                      user.status === "active" ? "#dcfce7" : "#e5e7eb",
                  },
                ]}
              >
                <Text
                  style={[
                    s.statusText,
                    { color: user.status === "active" ? "#166534" : "#374151" },
                  ]}
                >
                  {user.status}
                </Text>
              </View>
            </View>

            <View style={[s.metaRow, { borderTopColor: colors.border }]}>
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                Role:{" "}
                <Text style={{ color: colors.foreground }}>{user.role}</Text>
              </Text>
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                Route:{" "}
                <Text style={{ color: colors.foreground }}>
                  {user.routeCode}
                </Text>
              </Text>
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                Code:{" "}
                <Text style={{ color: colors.foreground }}>
                  {user.agentCode}
                </Text>
              </Text>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  openEditForm(user);
                }}
              >
                <Feather name="edit-2" size={14} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setResetUser(user);
                  setResetPassword("");
                  setResetConfirmPassword("");
                }}
              >
                <Feather name="key" size={14} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.primary }]}>
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.border }]}
                onPress={() => toggleStatus(user)}
              >
                <Feather
                  name={user.status === "active" ? "x-circle" : "check-circle"}
                  size={14}
                  color={user.status === "active" ? "#f59e0b" : "#16a34a"}
                />
                <Text
                  style={[
                    s.actionBtnText,
                    { color: user.status === "active" ? "#f59e0b" : "#16a34a" },
                  ]}
                >
                  {user.status === "active" ? "Deactivate" : "Activate"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.border }]}
                onPress={() => deleteUser(user)}
              >
                <Feather name="trash-2" size={14} color="#ef4444" />
                <Text style={[s.actionBtnText, { color: "#ef4444" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.foreground,
          fontFamily: "DMSans_700Bold",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.mutedForeground,
          fontFamily: "DMSans_400Regular",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, bottomPad: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: bottomPad + 24,
      gap: 12,
    },
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    subtitle: {
      fontSize: 13,
      marginTop: 2,
      fontFamily: "DMSans_400Regular",
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    newBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 38,
    },

    newBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    statsRow: {
      flexDirection: "row",
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 14,
    },
    formCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
    },
    formActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "DMSans_600SemiBold",
    },
    saveBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      paddingVertical: 2,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    filterChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginTop: 8,
      fontFamily: "DMSans_700Bold",
    },
    loadingBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
    },
    emptyBox: {
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 14,
      padding: 24,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    emptyText: {
      textAlign: "center",
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
    },
    userCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    userTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    userName: {
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    userEmail: {
      fontSize: 12,
      marginTop: 2,
      fontFamily: "DMSans_400Regular",
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
      textTransform: "capitalize",
    },
    metaRow: {
      borderTopWidth: 1,
      paddingTop: 10,
      gap: 4,
    },
    cardActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
    },

    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    actionBtnText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "DMSans_600SemiBold",
    },
    metaText: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
  });
}
