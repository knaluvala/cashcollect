import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  ParlorEntry,
  CollectionStatus,
  formatINR,
} from "@/lib/collectionTypes";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_CONFIG: Record<
  CollectionStatus,
  { label: string; bg: string; text: string }
> = {
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

export default function CollectionEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [parlor, setParlor] = useState<ParlorEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cash, setCash] = useState(parlor?.cashAmount?.toString() ?? "");
  const [coupon, setCoupon] = useState(parlor?.couponAmount?.toString() ?? "");
  const [cc, setCC] = useState(parlor?.ccAmount?.toString() ?? "");
  const [notes, setNotes] = useState(parlor?.notes ?? "");
  const [status, setStatus] = useState<CollectionStatus>(
    parlor?.status ?? "pending",
  );
  useEffect(() => {
    async function loadEntry() {
      if (!id) return;

      setIsLoading(true);

      try {
        const res = await apiFetch(`/api/collections/${id}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error ?? "Failed to load collection");
        }

        const c = result.collection ?? result;

        const mapped: ParlorEntry = {
          id: String(c.id),
          parlorCode: c.parlorCode,
          parlorName: c.parlorName,
          parlorType: c.parlorType,
          status: c.status,
          cashAmount: Number(c.cashAmount ?? 0),
          couponAmount: Number(c.couponAmount ?? 0),
          ccAmount: Number(c.ccAmount ?? 0),
          notes: c.notes ?? "",
          submittedAt: c.submittedAt,
          acknowledgedAt: c.acknowledgedAt,
          acknowledgedBy: c.acknowledgedBy,
        };

        setParlor(mapped);
        setCash(String(mapped.cashAmount ?? ""));
        setCoupon(String(mapped.couponAmount ?? ""));
        setCC(String(mapped.ccAmount ?? ""));
        setNotes(mapped.notes ?? "");
        setStatus(mapped.status);
      } catch (error) {
        console.error(error);
        Alert.alert(
          "Load Failed",
          error instanceof Error ? error.message : "Could not load collection",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEntry();
  }, [id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading collection...</Text>
      </View>
    );
  }
  if (!parlor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Parlor not found</Text>
      </View>
    );
  }

  const isLocked = status === "submitted" || status === "acknowledged";
  const statusCfg = STATUS_CONFIG[status];
  const typeCfg = PARLOR_TYPE_CONFIG[parlor.parlorType] ?? {
    bg: "#f1f5f9",
    text: "#475569",
  };

  const cashNum = parseFloat(cash.replace(/,/g, "")) || 0;
  const couponNum = parseFloat(coupon.replace(/,/g, "")) || 0;
  const ccNum = parseFloat(cc.replace(/,/g, "")) || 0;
  const total = cashNum + couponNum + ccNum;

  async function handleSaveDraft() {
    if (!parlor || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await apiFetch(`/api/collections/${parlor.id}`, {
        method: "PUT",
        body: JSON.stringify({
          cashAmount: cashNum,
          couponAmount: couponNum,
          ccAmount: ccNum,
          notes,
          status: "entered",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Failed to save draft");
      }

      setStatus("entered");
      Alert.alert("Saved", "Collection entry saved as draft.");
    } catch (error) {
      Alert.alert(
        "Save Failed",
        error instanceof Error ? error.message : "Unable to save draft.",
      );
    }
  }

  function handleSubmit() {
    if (!cash && !coupon && !cc) {
      Alert.alert(
        "Incomplete",
        "Please enter at least one amount before submitting.",
      );
      return;
    }
    Alert.alert(
      "Submit to Supervisor",
      "This will lock the entry for editing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            if (!parlor) return;

            try {
              await handleSaveDraft();

              const res = await apiFetch(
                `/api/collections/${parlor.id}/submit`,
                {
                  method: "POST",
                },
              );

              const result = await res.json();

              if (!res.ok) {
                throw new Error(result.error ?? "Failed to submit collection");
              }

              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setStatus("submitted");
              router.back();
            } catch (error) {
              Alert.alert(
                "Submit Failed",
                error instanceof Error
                  ? error.message
                  : "Unable to submit collection.",
              );
            }
          },
        },
      ],
    );
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Parlor header */}
      <View
        style={[
          styles.parlorHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.parlorHeaderTop}>
          <View style={styles.parlorIcon}>
            <Feather name="home" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.parlorName, { color: colors.foreground }]}>
              {parlor.parlorName}
            </Text>
            <View style={styles.parlorMeta}>
              <Text
                style={[styles.parlorCode, { color: colors.mutedForeground }]}
              >
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
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {status === "submitted" && (
          <View style={[styles.lockBanner, { backgroundColor: "#ede9fe" }]}>
            <Feather name="lock" size={13} color="#6d28d9" />
            <Text style={[styles.lockText, { color: "#6d28d9" }]}>
              Submitted {parlor.submittedAt}. Awaiting supervisor
              acknowledgment.
            </Text>
          </View>
        )}

        {status === "acknowledged" && (
          <View style={[styles.lockBanner, { backgroundColor: "#d1fae5" }]}>
            <Feather name="check-circle" size={13} color="#065f46" />
            <Text style={[styles.lockText, { color: "#065f46" }]}>
              Acknowledged {parlor.acknowledgedAt} by {parlor.acknowledgedBy}.
              No further edits allowed.
            </Text>
          </View>
        )}
      </View>

      {/* Amount form */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Feather name="dollar-sign" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Collection Amounts
          </Text>
        </View>

        <AmountField
          label="Cash Amount (₹)"
          hint="Physical currency collected"
          value={cash}
          onChange={setCash}
          locked={isLocked}
          colors={colors}
        />
        <AmountField
          label="Coupon Amount (₹)"
          hint="Physical coupons redeemed"
          value={coupon}
          onChange={setCoupon}
          locked={isLocked}
          colors={colors}
        />
        <AmountField
          label="Credit Card Total (₹)"
          hint="POS / card transaction total"
          value={cc}
          onChange={setCC}
          locked={isLocked}
          colors={colors}
        />

        {/* Total */}
        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
            Total Collection
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatINR(total)}
          </Text>
        </View>
      </View>

      {/* Notes */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Remarks / Notes
          </Text>
        </View>
        <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
          POS issues, missing slips, discrepancies, or any other notes
        </Text>
        <TextInput
          style={[
            styles.notesInput,
            {
              borderColor: colors.border,
              backgroundColor: isLocked ? colors.muted : colors.background,
              color: colors.foreground,
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          editable={!isLocked}
        />
      </View>

      {/* Action buttons */}
      {!isLocked && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.draftBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={handleSaveDraft}
            activeOpacity={0.7}
          >
            <Feather name="save" size={16} color={colors.foreground} />
            <Text style={[styles.draftBtnText, { color: colors.foreground }]}>
              Save Draft
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Submit to Supervisor</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function AmountField({
  label,
  hint,
  value,
  onChange,
  locked,
  colors,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  colors: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
        {hint}
      </Text>
      <View
        style={[
          styles.amountInputRow,
          {
            borderColor: colors.border,
            backgroundColor: locked ? colors.muted : colors.background,
          },
        ]}
      >
        <Text style={[styles.rupeeSymbol, { color: colors.mutedForeground }]}>
          ₹
        </Text>
        <TextInput
          style={[styles.amountInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          editable={!locked}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  parlorHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  parlorHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  parlorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  parlorName: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  parlorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
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
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  lockBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  lockText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    lineHeight: 17,
  },
  section: {
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
    marginBottom: 2,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  rupeeSymbol: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 20,
  },
  draftBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
});
