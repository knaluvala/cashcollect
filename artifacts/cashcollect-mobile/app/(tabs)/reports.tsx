import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  DETAILED_REPORT_DATA,
  SUMMARY_REPORT_DATA,
  COLLECTORS,
  DetailedReportRow,
  SummaryReportRow,
  formatINR,
} from "@/data/mockData";

type ReportTab = "detailed" | "summary";
type StatusFilter = "" | "submitted" | "acknowledged";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  submitted: { label: "Submitted", bg: "#ede9fe", text: "#6d28d9" },
  acknowledged: { label: "Acknowledged", bg: "#d1fae5", text: "#065f46" },
};

const PARLOR_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Mall: { bg: "#dbeafe", text: "#1d4ed8" },
  Standalone: { bg: "#f1f5f9", text: "#475569" },
  Event: { bg: "#ffedd5", text: "#c2410c" },
  Kiosk: { bg: "#ede9fe", text: "#6d28d9" },
};

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<ReportTab>("detailed");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [agentFilter, setAgentFilter] = useState<string>("");

  const filteredDetailed = useMemo(() => {
    return DETAILED_REPORT_DATA.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (agentFilter && row.agentCode !== agentFilter) return false;
      return true;
    });
  }, [statusFilter, agentFilter]);

  const filteredSummary = useMemo(() => {
    return SUMMARY_REPORT_DATA.filter((row) => {
      if (agentFilter && row.agentCode !== agentFilter) return false;
      return true;
    });
  }, [agentFilter]);

  const totals = useMemo(() => ({
    cash: filteredDetailed.reduce((s, r) => s + r.cashAmount, 0),
    coupon: filteredDetailed.reduce((s, r) => s + r.couponAmount, 0),
    cc: filteredDetailed.reduce((s, r) => s + r.ccAmount, 0),
    total: filteredDetailed.reduce((s, r) => s + r.total, 0),
  }), [filteredDetailed]);

  const s = makeStyles(colors, topPad, insets.bottom);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Reports</Text>
        <Text style={s.headerSub}>Collection data across all routes and parlors</Text>
      </View>

      {/* Filters */}
      <View style={s.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
          {/* Status filter */}
          {(["", "submitted", "acknowledged"] as StatusFilter[]).map((s_) => (
            <TouchableOpacity
              key={s_ || "all"}
              style={[
                filterStyles.chip,
                { borderColor: colors.border, backgroundColor: colors.card },
                statusFilter === s_ && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => { setStatusFilter(s_); Haptics.selectionAsync(); }}
            >
              <Text
                style={[
                  filterStyles.chipText,
                  { color: colors.mutedForeground },
                  statusFilter === s_ && { color: "#fff" },
                ]}
              >
                {s_ === "" ? "All Status" : STATUS_CONFIG[s_]?.label ?? s_}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={filterStyles.divider} />
          {/* Agent filter */}
          <TouchableOpacity
            style={[
              filterStyles.chip,
              { borderColor: colors.border, backgroundColor: colors.card },
              agentFilter === "" && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => { setAgentFilter(""); Haptics.selectionAsync(); }}
          >
            <Text style={[filterStyles.chipText, { color: agentFilter === "" ? "#fff" : colors.mutedForeground }]}>
              All Agents
            </Text>
          </TouchableOpacity>
          {COLLECTORS.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[
                filterStyles.chip,
                { borderColor: colors.border, backgroundColor: colors.card },
                agentFilter === c.code && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => { setAgentFilter(c.code); Haptics.selectionAsync(); }}
            >
              <Text
                style={[
                  filterStyles.chipText,
                  { color: colors.mutedForeground },
                  agentFilter === c.code && { color: "#fff" },
                ]}
              >
                {c.name.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.tab, activeTab === "detailed" && s.tabActive]}
          onPress={() => { setActiveTab("detailed"); Haptics.selectionAsync(); }}
        >
          <Feather name="list" size={14} color={activeTab === "detailed" ? colors.primary : colors.mutedForeground} />
          <Text style={[s.tabText, { color: activeTab === "detailed" ? colors.primary : colors.mutedForeground }]}>
            Detailed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === "summary" && s.tabActive]}
          onPress={() => { setActiveTab("summary"); Haptics.selectionAsync(); }}
        >
          <Feather name="bar-chart-2" size={14} color={activeTab === "summary" ? colors.primary : colors.mutedForeground} />
          <Text style={[s.tabText, { color: activeTab === "summary" ? colors.primary : colors.mutedForeground }]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "detailed" ? (
        <>
          {/* Totals strip */}
          <View style={[s.totalsStrip, { borderBottomColor: colors.border }]}>
            <Text style={[s.totalsCount, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: "700" as const, color: colors.foreground, fontFamily: "DMSans_700Bold" }}>
                {filteredDetailed.length}
              </Text>{" "}
              records
            </Text>
            <View style={s.totalsAmounts}>
              <TotalsChip label="Cash" value={formatINR(totals.cash)} color="#065f46" />
              <TotalsChip label="Coupons" value={formatINR(totals.coupon)} color="#1d4ed8" />
              <TotalsChip label="Card" value={formatINR(totals.cc)} color="#6d28d9" />
            </View>
          </View>

          <FlatList
            data={filteredDetailed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DetailedRow row={item} colors={colors} />}
            contentContainerStyle={s.listContent}
            ListEmptyComponent={<EmptyState colors={colors} />}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <FlatList
          data={filteredSummary}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SummaryRow row={item} colors={colors} />}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={<EmptyState colors={colors} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function TotalsChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Text style={{ fontSize: 12, color: "#64748b", fontFamily: "DMSans_400Regular" }}>
      {label}:{" "}
      <Text style={{ fontWeight: "600" as const, color, fontFamily: "DMSans_600SemiBold" }}>{value}</Text>
    </Text>
  );
}

function DetailedRow({ row, colors }: { row: DetailedReportRow; colors: any }) {
  const statusCfg = STATUS_CONFIG[row.status];
  const typeCfg = PARLOR_TYPE_COLORS[row.parlorType] ?? { bg: "#f1f5f9", text: "#475569" };
  return (
    <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={detailStyles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[detailStyles.parlorName, { color: colors.foreground }]} numberOfLines={1}>
            {row.parlorName}
          </Text>
          <View style={detailStyles.metaRow}>
            <Text style={[detailStyles.code, { color: colors.mutedForeground }]}>{row.parlorCode}</Text>
            <View style={[detailStyles.typeBadge, { backgroundColor: typeCfg.bg }]}>
              <Text style={[detailStyles.typeBadgeText, { color: typeCfg.text }]}>{row.parlorType}</Text>
            </View>
            <Text style={[detailStyles.code, { color: colors.mutedForeground }]}>{row.routeCode}</Text>
          </View>
          <Text style={[detailStyles.agentText, { color: colors.mutedForeground }]}>
            {row.agentName} · {row.supervisorName}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {statusCfg && (
            <View style={[detailStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[detailStyles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
            </View>
          )}
          <Text style={[detailStyles.date, { color: colors.mutedForeground }]}>{row.date}</Text>
        </View>
      </View>
      <View style={[detailStyles.amounts, { borderTopColor: colors.border }]}>
        <AmountBox label="Cash" value={formatINR(row.cashAmount)} color="#065f46" />
        <AmountBox label="Coupons" value={formatINR(row.couponAmount)} color="#1d4ed8" />
        <AmountBox label="Card" value={formatINR(row.ccAmount)} color="#6d28d9" />
        <AmountBox label="Total" value={formatINR(row.total)} color={colors.foreground} bold />
      </View>
    </View>
  );
}

function AmountBox({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 13, fontWeight: bold ? "700" : "600" as const, color, fontFamily: bold ? "DMSans_700Bold" : "DMSans_600SemiBold" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: "#64748b", fontFamily: "DMSans_400Regular" }}>{label}</Text>
    </View>
  );
}

function SummaryRow({ row, colors }: { row: SummaryReportRow; colors: any }) {
  const pctAck = row.parlorCount > 0 ? (row.acknowledgedCount / row.parlorCount) * 100 : 0;
  return (
    <View style={[summaryStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={summaryStyles.agentRow}>
        <View style={[summaryStyles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={summaryStyles.avatarText}>{row.agentName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[summaryStyles.agentName, { color: colors.foreground }]}>{row.agentName}</Text>
          <Text style={[summaryStyles.agentMeta, { color: colors.mutedForeground }]}>
            {row.agentCode} · Route {row.routeCode} · Supervisor: {row.supervisorName}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[summaryStyles.grandTotal, { color: colors.primary }]}>
            {formatINR(row.grandTotal)}
          </Text>
          <Text style={[summaryStyles.parlorCount, { color: colors.mutedForeground }]}>
            {row.parlorCount} parlors
          </Text>
        </View>
      </View>

      <View style={[summaryStyles.amounts, { borderTopColor: colors.border }]}>
        <SummaryAmount label="Cash" value={formatINR(row.totalCash)} color="#065f46" />
        <SummaryAmount label="Coupons" value={formatINR(row.totalCoupon)} color="#1d4ed8" />
        <SummaryAmount label="Card" value={formatINR(row.totalCC)} color="#6d28d9" />
      </View>

      {/* Progress bar */}
      <View style={summaryStyles.progressWrap}>
        <View style={[summaryStyles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              summaryStyles.progressFill,
              { width: `${pctAck}%` as any, backgroundColor: "#10b981" },
            ]}
          />
        </View>
        <Text style={[summaryStyles.progressLabel, { color: colors.mutedForeground }]}>
          {row.acknowledgedCount}/{row.parlorCount} acknowledged
        </Text>
      </View>
    </View>
  );
}

function SummaryAmount({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" as const, color, fontFamily: "DMSans_600SemiBold" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "#64748b", fontFamily: "DMSans_400Regular" }}>{label}</Text>
    </View>
  );
}

function EmptyState({ colors }: { colors: any }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, gap: 8 }}>
      <Feather name="inbox" size={40} color={colors.border} />
      <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }}>
        No records found
      </Text>
      <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>
        Try adjusting your filters
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.card,
      paddingTop: topPad + 8,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    filtersRow: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filtersScroll: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 6,
      alignItems: "center",
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      paddingHorizontal: 16,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginRight: 20,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500" as const,
      fontFamily: "DMSans_500Medium",
    },
    totalsStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.muted,
      borderBottomWidth: 1,
    },
    totalsCount: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
    },
    totalsAmounts: {
      flexDirection: "row",
      gap: 10,
    },
    listContent: {
      padding: 12,
      paddingBottom: Platform.OS === "web" ? 34 + 84 : bottomPad + 84,
      gap: 8,
    },
  });
}

const filterStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 2,
  },
});

const detailStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  parlorName: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  code: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  agentText: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  date: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  amounts: {
    flexDirection: "row",
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
  },
});

const summaryStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  agentName: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  agentMeta: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  grandTotal: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  parlorCount: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  amounts: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%" as any,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
});
