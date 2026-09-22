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
import { getCollectionsReports } from "@workspace/api-client-react";
import { hasPermission } from "@/lib/permissions";
import { STATUS_CONFIG } from "@/constants/statusColors";
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

function formatAED(value: number) {
  return `AED ${Number(value || 0).toLocaleString("en-AE")}`;
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
      const result = await getCollectionsReports({
        dateFrom: today,
        dateTo: today,
      });

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

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad + 8 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Dashboard
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Welcome, {user?.name ?? "User"}
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: 16,
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
              valueColor={colors.foreground}
            />
            <KpiCard
              label="Pending"
              value={totals.pending.toString()}
              colors={colors}
              valueColor={STATUS_CONFIG.pending.text}
            />
            <KpiCard
              label="Submitted"
              value={totals.submitted.toString()}
              colors={colors}
              valueColor={STATUS_CONFIG.submitted.text}
            />
            <KpiCard
              label="Ack'd"
              value={totals.acknowledged.toString()}
              colors={colors}
              valueColor={STATUS_CONFIG.acknowledged.text}
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
              value={formatAED(totals.cash)}
              colors={colors}
              valueColor="#047857"
            />
            <AmountRow
              label="Coupons"
              value={formatAED(totals.coupon)}
              colors={colors}
              valueColor="#1d4ed8"
            />
            <AmountRow
              label="Card"
              value={formatAED(totals.card)}
              colors={colors}
              valueColor="#6d28d9"
            />
            <AmountRow
              label="Total"
              value={formatAED(totals.grandTotal)}
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
              recentCollections.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status];
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.recentRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.recentTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {item.parlorName || item.parlorCode}
                      </Text>
                      <Text
                        style={[
                          styles.recentSub,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {item.agentName}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text
                        style={[
                          styles.recentAmount,
                          { color: colors.foreground },
                        ]}
                      >
                        {formatAED(
                          item.cashAmount + item.couponAmount + item.ccAmount,
                        )}
                      </Text>
                      {statusCfg && (
                        <View
                          style={[
                            styles.recentStatusBadge,
                            { backgroundColor: statusCfg.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.recentStatusText,
                              { color: statusCfg.text },
                            ]}
                          >
                            {statusCfg.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
      </ScrollView>
    </View>
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
  valueColor,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  valueColor?: string;
}) {
  return (
    <View
      style={[
        styles.kpiCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.kpiValue,
          { color: valueColor ?? colors.foreground },
        ]}
      >
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
  valueColor,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  bold?: boolean;
  valueColor?: string;
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
          { color: valueColor ?? colors.foreground },
          bold && { fontFamily: "DMSans_700Bold" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    borderRadius: 12,
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
    borderRadius: 12,
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
  recentStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
});
