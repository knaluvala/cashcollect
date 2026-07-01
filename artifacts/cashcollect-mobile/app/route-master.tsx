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

type ParlorRow = {
  code: string;
  name: string;
  type: string;
};

type RouteRow = {
  id: number;
  routeCode: string;
  description: string;
  assignedAgent: string;
  agentCode: string;
  supervisorName: string;
  supervisorCode: string;
  parlors: { code: string }[];
};

export default function RouteMasterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [parlors, setParlors] = useState<ParlorRow[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [newRouteCode, setNewRouteCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentCode, setNewAgentCode] = useState("");
  const [newSupervisorName, setNewSupervisorName] = useState("");
  const [newSupervisorCode, setNewSupervisorCode] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [parlorSearch, setParlorSearch] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;
  }, [routes, selectedRouteId]);

  const totalParlors = routes.reduce((sum, route) => {
    return sum + (route.parlors?.length ?? 0);
  }, 0);

  const filteredRoutes = routes.filter((route) => {
    const search = routeSearch.trim().toLowerCase();

    if (!search) return true;

    return (
      route.routeCode.toLowerCase().includes(search) ||
      route.description.toLowerCase().includes(search) ||
      route.assignedAgent.toLowerCase().includes(search) ||
      route.supervisorName.toLowerCase().includes(search)
    );
  });

  const assignedParlorCodes = new Set(
    selectedRoute?.parlors.map((p) => p.code) ?? [],
  );

  const availableParlors = parlors.filter((parlor) => {
    const search = parlorSearch.trim().toLowerCase();

    if (assignedParlorCodes.has(parlor.code)) return false;

    if (!search) return true;

    return (
      parlor.code.toLowerCase().includes(search) ||
      parlor.name.toLowerCase().includes(search) ||
      parlor.type.toLowerCase().includes(search)
    );
  });

  async function loadRoutes() {
    if (!refreshing) {
      setLoading(true);
    }

    try {
      const res = await apiFetch("/api/routes");

      if (!res.ok) {
        throw new Error(`Routes API failed: ${res.status}`);
      }

      const data = await res.json();
      const routeList: RouteRow[] = Array.isArray(data.routes)
        ? data.routes
        : [];

      setRoutes(routeList);

      if (!selectedRouteId && routeList.length > 0) {
        setSelectedRouteId(routeList[0].id);
      }
    } catch (error) {
      Alert.alert(
        "Failed to load routes",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  }

  async function loadParlors() {
    try {
      const res = await apiFetch("/api/parlors");

      if (!res.ok) {
        throw new Error(`Parlors API failed: ${res.status}`);
      }

      const data = await res.json();
      const parlorList: ParlorRow[] = Array.isArray(data.parlors)
        ? data.parlors.map((p: any) => ({
            code: p.parlorCode,
            name: p.parlorName,
            type: p.parlorType,
          }))
        : [];

      setParlors(parlorList);
    } catch (error) {
      Alert.alert(
        "Failed to load parlors",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function createRoute() {
    if (!newRouteCode.trim()) {
      Alert.alert("Missing route code", "Please enter a route code.");
      return;
    }

    try {
      const res = await apiFetch("/api/routes", {
        method: "POST",
        body: JSON.stringify({
          routeCode: newRouteCode.trim().toUpperCase(),
          description: newDescription.trim() || "—",
          assignedAgent: newAgentName.trim() || "—",
          agentCode: newAgentCode.trim() || "—",
          supervisorName: newSupervisorName.trim() || "—",
          supervisorCode: newSupervisorCode.trim() || "—",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create route");
      }

      setShowCreateForm(false);
      setNewRouteCode("");
      setNewDescription("");
      setNewAgentName("");
      setNewAgentCode("");
      setNewSupervisorName("");
      setNewSupervisorCode("");
      setSelectedRouteId(data.id);

      await loadRoutes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Create route failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function updateRoute() {
    if (!editingRouteId) return;

    if (!newRouteCode.trim()) {
      Alert.alert("Missing route code", "Please enter a route code.");
      return;
    }

    try {
      const res = await apiFetch(`/api/routes/${editingRouteId}`, {
        method: "PUT",
        body: JSON.stringify({
          routeCode: newRouteCode.trim().toUpperCase(),
          description: newDescription.trim() || "—",
          assignedAgent: newAgentName.trim() || "—",
          agentCode: newAgentCode.trim() || "—",
          supervisorName: newSupervisorName.trim() || "—",
          supervisorCode: newSupervisorCode.trim() || "—",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update route");
      }

      setShowCreateForm(false);
      setEditingRouteId(null);
      setNewRouteCode("");
      setNewDescription("");
      setNewAgentName("");
      setNewAgentCode("");
      setNewSupervisorName("");
      setNewSupervisorCode("");

      await loadRoutes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Update route failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  function startEditRoute(route: RouteRow) {
    setEditingRouteId(route.id);
    setShowCreateForm(true);
    setNewRouteCode(route.routeCode);
    setNewDescription(route.description);
    setNewAgentName(route.assignedAgent);
    setNewAgentCode(route.agentCode);
    setNewSupervisorName(route.supervisorName);
    setNewSupervisorCode(route.supervisorCode);
  }

  async function deleteRoute(route: RouteRow) {
    Alert.alert(
      "Delete route",
      `Delete route ${route.routeCode}? This will also remove its parlor assignments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/routes/${route.id}`, {
                method: "DELETE",
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.error || "Failed to delete route");
              }

              setSelectedRouteId(null);
              await loadRoutes();
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

  async function assignParlor(parlor: ParlorRow) {
    if (!selectedRoute) return;

    try {
      const res = await apiFetch(`/api/routes/${selectedRoute.id}/parlors`, {
        method: "POST",
        body: JSON.stringify({ parlorCode: parlor.code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign parlor");
      }

      await loadRoutes();
      setParlorSearch("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Assign parlor failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function removeParlor(parlorCode: string) {
    if (!selectedRoute) return;

    try {
      const res = await apiFetch(
        `/api/routes/${selectedRoute.id}/parlors/${parlorCode}`,
        { method: "DELETE" },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove parlor");
      }

      await loadRoutes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Remove parlor failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([loadRoutes(), loadParlors()]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRoutes();
    loadParlors();
  }, []);

  const s = makeStyles(colors, bottomPad);

  if (!hasPermission(user?.role, "route-master:view")) {
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
              You do not have permission to access Route Master.
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
          <Feather name="map" size={22} color="#1d4ed8" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>
            Route Master
          </Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            Manage route codes and assigned parlors
          </Text>
        </View>

        <TouchableOpacity
          style={[s.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowCreateForm((v) => !v);
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
        <StatBox
          label="Routes"
          value={routes.length.toString()}
          colors={colors}
        />
        <StatBox
          label="Parlors"
          value={totalParlors.toString()}
          colors={colors}
        />
        <StatBox
          label="Avg / Route"
          value={
            routes.length ? (totalParlors / routes.length).toFixed(1) : "0"
          }
          colors={colors}
        />
      </View>

      {showCreateForm && (
        <View
          style={[
            s.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[s.formTitle, { color: colors.foreground }]}>
            {editingRouteId ? "Edit Route" : "Create New Route"}
          </Text>

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Route Code"
            placeholderTextColor={colors.mutedForeground}
            value={newRouteCode}
            onChangeText={setNewRouteCode}
            autoCapitalize="characters"
          />

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Description"
            placeholderTextColor={colors.mutedForeground}
            value={newDescription}
            onChangeText={setNewDescription}
          />

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Agent Name"
            placeholderTextColor={colors.mutedForeground}
            value={newAgentName}
            onChangeText={setNewAgentName}
          />

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Agent Code"
            placeholderTextColor={colors.mutedForeground}
            value={newAgentCode}
            onChangeText={setNewAgentCode}
            autoCapitalize="characters"
          />

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Supervisor Name"
            placeholderTextColor={colors.mutedForeground}
            value={newSupervisorName}
            onChangeText={setNewSupervisorName}
          />

          <TextInput
            style={[
              s.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Supervisor Code"
            placeholderTextColor={colors.mutedForeground}
            value={newSupervisorCode}
            onChangeText={setNewSupervisorCode}
            autoCapitalize="characters"
          />

          <View style={s.formActions}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={[s.cancelBtnText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: colors.primary }]}
              onPress={editingRouteId ? updateRoute : createRoute}
            >
              <Text style={s.createBtnText}>
                {editingRouteId ? "Update Route" : "Create Route"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
            Loading routes...
          </Text>
        </View>
      ) : routes.length === 0 ? (
        <View
          style={[
            s.emptyBox,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Feather name="map-pin" size={32} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>
            No routes found
          </Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Create routes from the web admin panel or add them here in the next
            step.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>
            Routes
          </Text>

          <View
            style={[
              s.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.searchInput, { color: colors.foreground }]}
              placeholder="Search route, agent, supervisor..."
              placeholderTextColor={colors.mutedForeground}
              value={routeSearch}
              onChangeText={setRouteSearch}
            />
          </View>

          {filteredRoutes.map((route) => {
            const selected = selectedRoute?.id === route.id;

            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  s.routeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedRouteId(route.id);
                }}
              >
                <View style={s.routeTopRow}>
                  <View>
                    <Text
                      style={[
                        s.routeCode,
                        {
                          color: selected ? colors.primary : colors.foreground,
                        },
                      ]}
                    >
                      {route.routeCode}
                    </Text>
                    <Text
                      style={[
                        s.routeDescription,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {route.description}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    <View
                      style={[s.countBadge, { backgroundColor: colors.muted }]}
                    >
                      <Text
                        style={[s.countBadgeText, { color: colors.foreground }]}
                      >
                        {route.parlors?.length ?? 0} parlors
                      </Text>
                    </View>

                    <View style={s.cardActions}>
                      <TouchableOpacity
                        style={s.editBtn}
                        onPress={() => startEditRoute(route)}
                      >
                        <Feather
                          name="edit-2"
                          size={16}
                          color={colors.primary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => deleteRoute(route)}
                      >
                        <Feather name="trash-2" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[s.metaRow, { borderTopColor: colors.border }]}>
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                    Agent:{" "}
                    <Text style={{ color: colors.foreground }}>
                      {route.assignedAgent}
                    </Text>
                  </Text>
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>
                    Supervisor:{" "}
                    <Text style={{ color: colors.foreground }}>
                      {route.supervisorName}
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedRoute && (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>
                Assigned Parlors — {selectedRoute.routeCode}
              </Text>

              <View
                style={[
                  s.parlorList,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {selectedRoute.parlors.length === 0 ? (
                  <Text
                    style={[
                      s.emptyParlorText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    No parlors assigned to this route.
                  </Text>
                ) : (
                  selectedRoute.parlors.map((parlor, index) => (
                    <View
                      key={`${parlor.code}-${index}`}
                      style={[
                        s.parlorRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          s.parlorIndex,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {index + 1}
                      </Text>

                      <Text
                        style={[s.parlorCode, { color: colors.foreground }]}
                      >
                        {parlor.code}
                      </Text>

                      <TouchableOpacity
                        style={s.removeParlorBtn}
                        onPress={() => removeParlor(parlor.code)}
                      >
                        <Feather name="x" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <Text style={[s.sectionTitle, { color: colors.foreground }]}>
                Add Parlors
              </Text>

              <View
                style={[
                  s.searchBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather
                  name="search"
                  size={16}
                  color={colors.mutedForeground}
                />
                <TextInput
                  style={[s.searchInput, { color: colors.foreground }]}
                  placeholder="Search parlor code, name, type..."
                  placeholderTextColor={colors.mutedForeground}
                  value={parlorSearch}
                  onChangeText={setParlorSearch}
                />
              </View>

              <View
                style={[
                  s.parlorList,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {availableParlors.length === 0 ? (
                  <Text
                    style={[
                      s.emptyParlorText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    No available parlors found.
                  </Text>
                ) : (
                  availableParlors.map((parlor, index) => (
                    <View
                      key={`${parlor.code}-${index}`}
                      style={[
                        s.parlorRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[s.parlorCode, { color: colors.foreground }]}
                        >
                          {parlor.code}
                        </Text>
                        <Text
                          style={[
                            s.parlorName,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {parlor.name} · {parlor.type}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          s.assignParlorBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => assignParlor(parlor)}
                      >
                        <Feather name="plus" size={15} color="#fff" />
                        <Text style={s.assignParlorText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </>
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
    newBtn: {
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    newBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
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
    createBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    createBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
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
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginTop: 8,
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
    routeCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    routeTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    routeCode: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
    routeDescription: {
      fontSize: 12,
      marginTop: 2,
      fontFamily: "DMSans_400Regular",
    },
    countBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      fontFamily: "DMSans_600SemiBold",
    },
    cardActions: {
      flexDirection: "row",
      gap: 4,
    },
    editBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    metaRow: {
      borderTopWidth: 1,
      paddingTop: 10,
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
    parlorList: {
      borderWidth: 1,
      borderRadius: 14,
      overflow: "hidden",
    },
    emptyParlorText: {
      padding: 16,
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
    },
    parlorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    parlorIndex: {
      width: 24,
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
    parlorCode: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "DMSans_600SemiBold",
    },
    parlorName: {
      fontSize: 11,
      marginTop: 2,
      fontFamily: "DMSans_400Regular",
    },
    removeParlorBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    assignParlorBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    assignParlorText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      fontFamily: "DMSans_700Bold",
    },
  });
}
