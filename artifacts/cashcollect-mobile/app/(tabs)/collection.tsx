import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  MOCK_PARLORS,
  SUPERVISOR_PENDING,
  ParlorEntry,
  SupervisorPendingItem,
  CollectionStatus,
  formatINR,
} from "@/data/mockData";

const STATUS_CONFIG: Record<CollectionStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "#fef9c3", text: "#854d0e" },
  entered: { label: "Entered", bg: "#dbeafe", text: "#1d4ed8" },
  submitted: { label: "Submitted", bg: "#ede9fe", text: "#6d28d9" },
  acknowledged: { label: "Acknowledged", bg: "#d1fae5", text: "#065f46" },
};

const PARLOR_TYPE_CONFIG: Record<string, { bg: string; text: string }> = {
  Mall: { bg: "#dbeafe", text: "#1d4ed8" },
  Standalone: { bg: "#f1f5f9", text: "#475569" },
  Event: { bg: "#ffedd5", text: "#c2410c" },
  Kiosk: { bg: "#ede9fe", text: "#6d28d9" },
};

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"agent" | "supervisor">(
    user?.role === "supervisor" ? "supervisor" : "agent"
  );
  const [parlors, setParlors] = useState<ParlorEntry[]>(MOCK_PARLORS);
  const [supervisorItems, setSupervisorItems] = useState<SupervisorPendingItem[]>(SUPERVISOR_PENDING);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const statusCounts = {
    pending: parlors.filter((p) => p.status === "pending").length,
    entered: parlors.filter((p) => p.status === "entered").length,
    submitted: parlors.filter((p) => p.status === "submitted").length,
    acknowledged: parlors.filter((p) => p.status === "acknowledged").length,
  };

  const totalCash = parlors.reduce((s, p) => s + (p.cashAmount ?? 0), 0);
  const totalCoupon = parlors.reduce((s, p) => s + (p.couponAmount ?? 0), 0);
  const totalCC = parlors.reduce((s, p) => s + (p.ccAmount ?? 0), 0);

  const pendingAckCount = supervisorItems.filter((i) => i.status === "submitted").length;

  function handleParlorPress(parlor: ParlorEntry) {
    Haptics.selectionAsync();
    router.push({ pathname: "/entry/[id]", params: { id: parlor.id } });
  }

  function handleAcknowledge(itemId: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSupervisorItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "acknowledged" as const } : item
      )
    );
  }

  const s = makeStyles(colors, topPad, insets.bottom);

  return (
    <View style={s.container}>
      {/* FAB — New Entry (agent view) or Create New Entry (supervisor view) */}
      {user?.role !== "superadmin" && (
        <TouchableOpacity
          style={[fabStyle.fab, { backgroundColor: viewMode === "supervisor" ? colors.primary : colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/new-entry");
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Daily Collection</Text>
            {user?.role === "agent" && (
              <Text style={s.headerSub}>
                Route {user.route} · {user.name} ({user.code})
              </Text>
            )}
            {user?.role === "supervisor" && (
              <Text style={s.headerSub}>{user.name} · {user.code}</Text>
            )}
          </View>
          {(user?.role === "supervisor" || user?.role === "agent") && (
            <View style={s.viewToggle}>
              <TouchableOpacity
                style={[s.toggleBtn, viewMode === "agent" && s.toggleBtnActive]}
                onPress={() => setViewMode("agent")}
              >
                <Text style={[s.toggleText, viewMode === "agent" && s.toggleTextActive]}>
                  Agent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, viewMode === "supervisor" && s.toggleBtnActive]}
                onPress={() => setViewMode("supervisor")}
              >
                {pendingAckCount > 0 && viewMode !== "supervisor" && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{pendingAckCount}</Text>
                  </View>
                )}
                <Text style={[s.toggleText, viewMode === "supervisor" && s.toggleTextActive]}>
                  Supervisor
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {viewMode === "agent" && (
          <View style={s.statsBar}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{parlors.length}</Text>
              <Text style={s.statLabel}>Assigned</Text>
            </View>
            <View style={s.statDivider} />
            <View style={[s.statItem, { alignItems: "center" }]}>
              <Text style={[s.statNum, { color: "#854d0e" }]}>{statusCounts.pending}</Text>
              <Text style={s.statLabel}>Pending</Text>
            </View>
            <View style={s.statDivider} />
            <View style={[s.statItem, { alignItems: "center" }]}>
              <Text style={[s.statNum, { color: "#1d4ed8" }]}>{statusCounts.entered}</Text>
              <Text style={s.statLabel}>Entered</Text>
            </View>
            <View style={s.statDivider} />
            <View style={[s.statItem, { alignItems: "center" }]}>
              <Text style={[s.statNum, { color: "#6d28d9" }]}>{statusCounts.submitted}</Text>
              <Text style={s.statLabel}>Submitted</Text>
            </View>
            <View style={s.statDivider} />
            <View style={[s.statItem, { alignItems: "center" }]}>
              <Text style={[s.statNum, { color: "#065f46" }]}>{statusCounts.acknowledged}</Text>
              <Text style={s.statLabel}>Ack'd</Text>
            </View>
          </View>
        )}

        {viewMode === "agent" && (
          <View style={s.totalsBar}>
            <TotalChip label="Cash" amount={totalCash} color="#065f46" colors={colors} />
            <TotalChip label="Coupons" amount={totalCoupon} color="#1d4ed8" colors={colors} />
            <TotalChip label="Card" amount={totalCC} color="#6d28d9" colors={colors} />
          </View>
        )}
      </View>

      {viewMode === "agent" ? (
        <FlatList
          data={parlors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ParlorItem parlor={item} onPress={handleParlorPress} colors={colors} />
          )}
          contentContainerStyle={s.listContent}
          scrollEnabled={parlors.length > 0}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={supervisorItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SupervisorItem
              item={item}
              onAcknowledge={handleAcknowledge}
              colors={colors}
            />
          )}
          contentContainerStyle={s.listContent}
          ListHeaderComponent={
            <View style={s.supervisorHeader}>
              <Text style={s.supervisorHeaderTitle}>
                Pending Acknowledgments
              </Text>
              <Text style={s.supervisorHeaderSub}>
                {supervisorItems.filter((i) => i.status === "submitted").length} awaiting review
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="check-circle" size={40} color={colors.border} />
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptySub}>No pending submissions to acknowledge</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function TotalChip({ label, amount, color, colors }: { label: string; amount: number; color: string; colors: any }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: "700" as const, color, fontFamily: "DMSans_700Bold" }}>
        {formatINR(amount)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>
        {label}
      </Text>
    </View>
  );
}

function ParlorItem({
  parlor,
  onPress,
  colors,
}: {
  parlor: ParlorEntry;
  onPress: (p: ParlorEntry) => void;
  colors: any;
}) {
  const statusCfg = STATUS_CONFIG[parlor.status];
  const typeCfg = PARLOR_TYPE_CONFIG[parlor.parlorType] ?? { bg: "#f1f5f9", text: "#475569" };
  const total = (parlor.cashAmount ?? 0) + (parlor.couponAmount ?? 0) + (parlor.ccAmount ?? 0);

  return (
    <TouchableOpacity
      style={[styles.parlorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(parlor)}
      activeOpacity={0.7}
    >
      <View style={styles.parlorCardTop}>
        <View style={styles.parlorInfo}>
          <Text
            style={[styles.parlorName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {parlor.parlorName}
          </Text>
          <View style={styles.parlorMeta}>
            <Text style={[styles.parlorCode, { color: colors.mutedForeground }]}>
              {parlor.parlorCode}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeCfg.text }]}>
                {parlor.parlorType}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusCfg.text }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {parlor.cashAmount !== null && (
        <View style={[styles.parlorAmounts, { borderTopColor: colors.border }]}>
          <AmountChip label="₹" value={formatINR(parlor.cashAmount ?? 0)} color="#065f46" />
          <AmountChip label="+" value={formatINR(parlor.couponAmount ?? 0)} color="#1d4ed8" />
          <AmountChip label="+" value={formatINR(parlor.ccAmount ?? 0)} color="#6d28d9" />
          <View style={{ flex: 1 }} />
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatINR(total)}
          </Text>
        </View>
      )}

      {parlor.acknowledgedBy && (
        <Text style={[styles.ackBy, { color: colors.mutedForeground }]}>
          Ack by {parlor.acknowledgedBy}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function AmountChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Text style={{ fontSize: 13, color, fontWeight: "600" as const, fontFamily: "DMSans_600SemiBold" }}>
      {label} {value}
    </Text>
  );
}

function SupervisorItem({
  item,
  onAcknowledge,
  colors,
}: {
  item: SupervisorPendingItem;
  onAcknowledge: (id: string) => void;
  colors: any;
}) {
  const isAcknowledged = item.status === "acknowledged";
  return (
    <View style={[styles.supCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.supCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.supParlorName, { color: colors.foreground }]} numberOfLines={1}>
            {item.parlorName}
          </Text>
          <Text style={[styles.supMeta, { color: colors.mutedForeground }]}>
            {item.parlorCode} · {item.agentName} ({item.agentCode})
          </Text>
          <Text style={[styles.supTime, { color: colors.mutedForeground }]}>
            Submitted {item.submittedAt}
          </Text>
        </View>
        {isAcknowledged ? (
          <View style={[styles.ackBadge, { backgroundColor: "#d1fae5" }]}>
            <Feather name="check" size={14} color="#065f46" />
            <Text style={[styles.ackBadgeText, { color: "#065f46" }]}>Done</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ackBtn, { backgroundColor: colors.primary }]}
            onPress={() => onAcknowledge(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.ackBtnText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.supAmounts, { borderTopColor: colors.border }]}>
        <SupAmount label="Cash" value={formatINR(item.cashAmount)} color="#065f46" />
        <SupAmount label="Coupons" value={formatINR(item.couponAmount)} color="#1d4ed8" />
        <SupAmount label="Card" value={formatINR(item.ccAmount)} color="#6d28d9" />
        <SupAmount
          label="Total"
          value={formatINR(item.cashAmount + item.couponAmount + item.ccAmount)}
          color={colors.foreground}
          bold
        />
      </View>
    </View>
  );
}

function SupAmount({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: bold ? "700" : "600" as const, color, fontFamily: bold ? "DMSans_700Bold" : "DMSans_600SemiBold" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#64748b", fontFamily: "DMSans_400Regular" }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: topPad + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "DMSans_700Bold",
    },
    headerSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
      marginTop: 2,
    },
    viewToggle: {
      flexDirection: "row",
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 3,
    },
    toggleBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      position: "relative",
    },
    toggleBtnActive: {
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "DMSans_500Medium",
      fontWeight: "500" as const,
    },
    toggleTextActive: {
      color: colors.foreground,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    badge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: colors.accent,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "DMSans_700Bold",
    },
    statsBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    statItem: {
      flex: 1,
    },
    statNum: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "DMSans_700Bold",
      textAlign: "center",
    },
    statLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      textAlign: "center",
      fontFamily: "DMSans_400Regular",
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    totalsBar: {
      flexDirection: "row",
      paddingVertical: 4,
    },
    listContent: {
      padding: 12,
      paddingBottom: Platform.OS === "web" ? 34 + 84 : bottomPad + 84,
      gap: 8,
    },
    supervisorHeader: {
      marginBottom: 8,
    },
    supervisorHeaderTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "DMSans_700Bold",
    },
    supervisorHeaderSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      fontFamily: "DMSans_600SemiBold",
    },
    emptySub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
    },
  });
}

const styles = StyleSheet.create({
  parlorCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  parlorCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  parlorInfo: {
    flex: 1,
  },
  parlorName: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 4,
  },
  parlorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  parlorCode: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  parlorAmounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  ackBy: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
  },
  supCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 0,
  },
  supCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  supParlorName: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 2,
  },
  supMeta: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  supTime: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  ackBtn: {
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: "center",
  },
  ackBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  ackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ackBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  supAmounts: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});

const fabStyle = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "web" ? 34 + 84 + 16 : 84 + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
});
