import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
type DashboardCollection = {
  id: number;
  status: "pending" | "entered" | "submitted" | "acknowledged";
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  parlorName: string;
  parlorCode: string;
  agentName: string;
  collectionDate?: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function numVal(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

function formatINR(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [collections, setCollections] = useState<DashboardCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setLoadError("");

    try {
      const today = todayStr();
      const res = await apiFetch(
        `/api/collections/reports?dateFrom=${today}&dateTo=${today}`,
      );

      if (!res.ok) {
        throw new Error(`Dashboard API failed: ${res.status}`);
      }

      const result = await res.json();
      const rows: DashboardCollection[] = Array.isArray(result.collections)
        ? result.collections.map((row: any) => ({
            id: Number(row.id),
            status: row.status ?? "pending",
            cashAmount: numVal(row.cashAmount),
            couponAmount: numVal(row.couponAmount),
            ccAmount: numVal(row.ccAmount),
            parlorName: row.parlorName ?? "",
            parlorCode: row.parlorCode ?? "",
            agentName: row.agentName ?? "",
            collectionDate: row.collectionDate,
          }))
        : [];

      setCollections(rows);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totals = useMemo(() => {
    const pending = collections.filter((c) => c.status === "pending").length;
    const entered = collections.filter((c) => c.status === "entered").length;
    const submitted = collections.filter(
      (c) => c.status === "submitted",
    ).length;
    const acknowledged = collections.filter(
      (c) => c.status === "acknowledged",
    ).length;

    const cash = collections.reduce((sum, c) => sum + c.cashAmount, 0);
    const coupon = collections.reduce((sum, c) => sum + c.couponAmount, 0);
    const card = collections.reduce((sum, c) => sum + c.ccAmount, 0);

    return {
      total: collections.length,
      pending,
      entered,
      submitted,
      acknowledged,
      cash,
      coupon,
      card,
      grandTotal: cash + coupon + card,
    };
  }, [collections]);

  const recentCollections = useMemo(() => {
    return collections.slice(0, 5);
  }, [collections]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboard]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: Platform.OS === "web" ? 110 : insets.bottom + 110,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Welcome, {user?.name ?? "User"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Loading dashboard...
          </Text>
        </View>
      ) : loadError ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Unable to load dashboard
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {loadError}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Today"
              value={totals.total.toString()}
              colors={colors}
            />
            <KpiCard
              label="Pending"
              value={totals.pending.toString()}
              colors={colors}
            />
            <KpiCard
              label="Submitted"
              value={totals.submitted.toString()}
              colors={colors}
            />
            <KpiCard
              label="Ack'd"
              value={totals.acknowledged.toString()}
              colors={colors}
            />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Amount Summary
            </Text>
            <AmountRow
              label="Cash"
              value={formatINR(totals.cash)}
              colors={colors}
            />
            <AmountRow
              label="Coupons"
              value={formatINR(totals.coupon)}
              colors={colors}
            />
            <AmountRow
              label="Card"
              value={formatINR(totals.card)}
              colors={colors}
            />
            <AmountRow
              label="Total"
              value={formatINR(totals.grandTotal)}
              colors={colors}
              bold
            />
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Quick Actions
            </Text>

            <View style={styles.actionGrid}>
              {hasPermission(user?.role, "collection:create") && (
                <QuickAction
                  label="New Entry"
                  icon="plus-circle"
                  colors={colors}
                  onPress={() => router.push("/new-entry")}
                />
              )}

              {hasPermission(user?.role, "reports:view") && (
                <QuickAction
                  label="Reports"
                  icon="bar-chart-2"
                  colors={colors}
                  onPress={() => router.push("/(tabs)/reports")}
                />
              )}

              {hasPermission(user?.role, "route-master:view") && (
                <QuickAction
                  label="Routes"
                  icon="map"
                  colors={colors}
                  onPress={() => router.push("/route-master")}
                />
              )}

              {hasPermission(user?.role, "user-management:view") && (
                <QuickAction
                  label="Users"
                  icon="users"
                  colors={colors}
                  onPress={() =>
                    router.push({ pathname: "/user-management" } as any)
                  }
                />
              )}

              {hasPermission(user?.role, "parlor-master:view") && (
                <QuickAction
                  label="Parlors"
                  icon="upload"
                  colors={colors}
                  onPress={() => router.push("/parlor-master")}
                />
              )}
            </View>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Recent Collections
            </Text>

            {recentCollections.length === 0 ? (
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                No collections found for today.
              </Text>
            ) : (
              recentCollections.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.recentRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.recentTitle, { color: colors.foreground }]}
                    >
                      {item.parlorName || item.parlorCode}
                    </Text>
                    <Text
                      style={[
                        styles.recentSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.agentName} · {item.status}
                    </Text>
                  </View>

                  <Text
                    style={[styles.recentAmount, { color: colors.foreground }]}
                  >
                    {formatINR(
                      item.cashAmount + item.couponAmount + item.ccAmount,
                    )}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function QuickAction({
  label,
  icon,
  colors,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Feather name={icon} size={18} color={colors.primary} />
      <Text style={[styles.actionText, { color: colors.foreground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function KpiCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.kpiCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.kpiValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function AmountRow({
  label,
  value,
  colors,
  bold,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  bold?: boolean;
}) {
  return (
    <View style={[styles.amountRow, { borderBottomColor: colors.border }]}>
      <Text
        style={[
          styles.amountLabel,
          { color: colors.mutedForeground },
          bold && { fontFamily: "DMSans_700Bold", color: colors.foreground },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.amountValue,
          { color: colors.foreground },
          bold && { fontFamily: "DMSans_700Bold" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    marginTop: 4,
  },
  header: {
    marginBottom: 18,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  kpiValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
  },
  kpiLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    marginBottom: 10,
  },
  cardSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionBtn: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  amountLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
  },
  amountValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
  },
  recentSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    marginTop: 3,
    textTransform: "capitalize",
  },
  recentAmount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
});
