import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { MOCK_PARLORS, ParlorEntry, CollectionStatus, formatINR } from "@/data/mockData";

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

export default function NewEntryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [parlorPickerOpen, setParlorPickerOpen] = useState(false);
  const [selectedParlor, setSelectedParlor] = useState<ParlorEntry | null>(null);
  const [cash, setCash] = useState("");
  const [coupon, setCoupon] = useState("");
  const [cc, setCC] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredParlors = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return MOCK_PARLORS;
    return MOCK_PARLORS.filter(
      (p) =>
        p.parlorName.toLowerCase().includes(q) ||
        p.parlorCode.toLowerCase().includes(q) ||
        p.parlorType.toLowerCase().includes(q)
    );
  }, [search]);

  function selectParlor(parlor: ParlorEntry) {
    Haptics.selectionAsync();
    setSelectedParlor(parlor);
    setCash(parlor.cashAmount?.toString() ?? "");
    setCoupon(parlor.couponAmount?.toString() ?? "");
    setCC(parlor.ccAmount?.toString() ?? "");
    setNotes(parlor.notes ?? "");
    setSaved(false);
    setParlorPickerOpen(false);
    setSearch("");
  }

  const cashNum = parseFloat(cash.replace(/,/g, "")) || 0;
  const couponNum = parseFloat(coupon.replace(/,/g, "")) || 0;
  const ccNum = parseFloat(cc.replace(/,/g, "")) || 0;
  const total = cashNum + couponNum + ccNum;

  const isReadOnly =
    selectedParlor?.status === "submitted" ||
    selectedParlor?.status === "acknowledged";
  const canSubmit = saved || selectedParlor?.status === "entered";

  async function handleSaveDraft() {
    if (!selectedParlor) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    setSaved(true);
    Alert.alert("Saved", `Draft saved for ${selectedParlor.parlorName}`);
  }

  async function handleSubmit() {
    if (!selectedParlor) return;
    if (!cash && !coupon && !cc) {
      Alert.alert("Incomplete", "Please enter at least one amount.");
      return;
    }
    Alert.alert(
      "Submit to Supervisor",
      `Submit collection of ${formatINR(total)} for ${selectedParlor.parlorName}? This cannot be edited after submission.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await new Promise((r) => setTimeout(r, 600));
            setIsSubmitting(false);
            router.back();
          },
        },
      ]
    );
  }

  const s = makeStyles(colors, insets.top, bottomPad);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Parlor selector */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Feather name="home" size={15} color={colors.primary} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Select Parlor</Text>
            <Text style={s.required}>*</Text>
          </View>

          <TouchableOpacity
            style={[
              s.parlorSelector,
              { borderColor: selectedParlor ? colors.primary : colors.border, backgroundColor: colors.background },
            ]}
            onPress={() => { setParlorPickerOpen(true); Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            {selectedParlor ? (
              <View style={s.parlorSelectedContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.parlorSelectedName, { color: colors.foreground }]} numberOfLines={1}>
                    {selectedParlor.parlorName}
                  </Text>
                  <View style={s.parlorSelectedMeta}>
                    <Text style={[s.parlorCode, { color: colors.mutedForeground }]}>
                      {selectedParlor.parlorCode}
                    </Text>
                    {(() => {
                      const cfg = PARLOR_TYPE_CONFIG[selectedParlor.parlorType];
                      return (
                        <View style={[s.typeBadge, { backgroundColor: cfg?.bg }]}>
                          <Text style={[s.typeBadgeText, { color: cfg?.text }]}>
                            {selectedParlor.parlorType}
                          </Text>
                        </View>
                      );
                    })()}
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedParlor.status];
                      return (
                        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[s.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
                <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
              </View>
            ) : (
              <View style={s.parlorPlaceholderRow}>
                <Feather name="search" size={15} color={colors.mutedForeground} />
                <Text style={[s.parlorPlaceholder, { color: colors.mutedForeground }]}>
                  Search and select a parlor...
                </Text>
                <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Amounts form */}
        {selectedParlor && (
          <>
            {/* Read-only banner */}
            {isReadOnly && (
              <View
                style={[
                  s.lockBanner,
                  {
                    backgroundColor: selectedParlor.status === "acknowledged" ? "#d1fae5" : "#ede9fe",
                    borderColor: selectedParlor.status === "acknowledged" ? "#a7f3d0" : "#c4b5fd",
                  },
                ]}
              >
                <Feather
                  name={selectedParlor.status === "acknowledged" ? "check-circle" : "lock"}
                  size={14}
                  color={selectedParlor.status === "acknowledged" ? "#065f46" : "#6d28d9"}
                />
                <Text
                  style={[
                    s.lockText,
                    { color: selectedParlor.status === "acknowledged" ? "#065f46" : "#6d28d9" },
                  ]}
                >
                  {selectedParlor.status === "acknowledged"
                    ? "Acknowledged — no further edits allowed."
                    : "Submitted — awaiting supervisor acknowledgment."}
                </Text>
              </View>
            )}

            {/* Amount inputs */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <View style={s.sectionIconWrap}>
                  <Feather name="dollar-sign" size={15} color={colors.primary} />
                </View>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Collection Amounts</Text>
              </View>

              <AmountRow
                label="Cash Amount"
                hint="Physical currency collected"
                value={cash}
                onChange={setCash}
                locked={isReadOnly}
                accentColor="#065f46"
                colors={colors}
              />
              <View style={[s.fieldDivider, { backgroundColor: colors.border }]} />
              <AmountRow
                label="Coupon Amount"
                hint="Physical coupons redeemed"
                value={coupon}
                onChange={setCoupon}
                locked={isReadOnly}
                accentColor="#1d4ed8"
                colors={colors}
              />
              <View style={[s.fieldDivider, { backgroundColor: colors.border }]} />
              <AmountRow
                label="Credit Card Total"
                hint="POS / card transaction total"
                value={cc}
                onChange={setCC}
                locked={isReadOnly}
                accentColor="#6d28d9"
                colors={colors}
              />

              {total > 0 && (
                <View style={[s.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[s.totalLabel, { color: colors.mutedForeground }]}>Total Collection</Text>
                  <Text style={[s.totalAmount, { color: colors.primary }]}>{formatINR(total)}</Text>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <View style={s.sectionIconWrap}>
                  <Feather name="file-text" size={15} color={colors.primary} />
                </View>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Remarks</Text>
                <Text style={[s.optional, { color: colors.mutedForeground }]}>Optional</Text>
              </View>
              <TextInput
                style={[
                  s.notesInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: isReadOnly ? colors.muted : colors.background,
                    color: colors.foreground,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="POS issues, missing slips, discrepancies..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                editable={!isReadOnly}
              />
            </View>

            {/* Actions */}
            {!isReadOnly && (
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.draftBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  {isSaving ? (
                    <Text style={[s.draftBtnText, { color: colors.mutedForeground }]}>Saving…</Text>
                  ) : (
                    <>
                      <Feather name="save" size={15} color={colors.foreground} />
                      <Text style={[s.draftBtnText, { color: colors.foreground }]}>Save Draft</Text>
                    </>
                  )}
                </TouchableOpacity>

                {canSubmit && (
                  <TouchableOpacity
                    style={[s.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <Text style={s.submitBtnText}>Submitting…</Text>
                    ) : (
                      <>
                        <Feather name="send" size={15} color="#fff" />
                        <Text style={s.submitBtnText}>Submit to Supervisor</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* Empty prompt when no parlor selected */}
        {!selectedParlor && (
          <View style={[s.emptyPrompt, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.background }]}>
              <Feather name="home" size={22} color={colors.mutedForeground} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              Select a parlor to begin
            </Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              Tap the field above to search and choose a parlor from your assigned route
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Parlor Picker Modal */}
      <Modal
        visible={parlorPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setParlorPickerOpen(false)}
      >
        <View style={[s.pickerModal, { backgroundColor: colors.background }]}>
          {/* Modal header */}
          <View style={[s.pickerHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={[s.pickerTitle, { color: colors.foreground }]}>Select Parlor</Text>
              <Text style={[s.pickerSub, { color: colors.mutedForeground }]}>
                {MOCK_PARLORS.length} parlors on your route
              </Text>
            </View>
            <TouchableOpacity
              style={[s.pickerCloseBtn, { backgroundColor: colors.muted }]}
              onPress={() => setParlorPickerOpen(false)}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={[s.searchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={[s.searchInput, { backgroundColor: colors.muted }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[s.searchText, { color: colors.foreground }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, code, type..."
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x-circle" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Parlor list */}
          <FlatList
            data={filteredParlors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const typeCfg = PARLOR_TYPE_CONFIG[item.parlorType];
              const statusCfg = STATUS_CONFIG[item.status];
              const isSelected = selectedParlor?.id === item.id;
              return (
                <TouchableOpacity
                  style={[
                    s.parlorRow,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: isSelected ? colors.primary + "0d" : colors.card,
                    },
                  ]}
                  onPress={() => selectParlor(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.parlorRowIcon,
                      { backgroundColor: isSelected ? colors.primary + "20" : colors.muted },
                    ]}
                  >
                    <Feather
                      name="home"
                      size={16}
                      color={isSelected ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.parlorRowName,
                        { color: isSelected ? colors.primary : colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.parlorName}
                    </Text>
                    <View style={s.parlorRowMeta}>
                      <Text style={[s.parlorRowCode, { color: colors.mutedForeground }]}>
                        {item.parlorCode}
                      </Text>
                      <View style={[s.typeBadge, { backgroundColor: typeCfg?.bg }]}>
                        <Text style={[s.typeBadgeText, { color: typeCfg?.text }]}>{item.parlorType}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[s.statusBadgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.searchEmpty}>
                <Feather name="search" size={28} color={colors.border} />
                <Text style={[s.searchEmptyText, { color: colors.mutedForeground }]}>
                  No parlors match "{search}"
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: bottomPad + 16 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

function AmountRow({
  label,
  hint,
  value,
  onChange,
  locked,
  accentColor,
  colors,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  accentColor: string;
  colors: any;
}) {
  return (
    <View style={amtStyles.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[amtStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[amtStyles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
      </View>
      <View
        style={[
          amtStyles.inputWrap,
          {
            borderColor: colors.border,
            backgroundColor: locked ? colors.muted : colors.background,
          },
        ]}
      >
        <Text style={[amtStyles.rupee, { color: colors.mutedForeground }]}>₹</Text>
        <TextInput
          style={[amtStyles.input, { color: locked ? colors.mutedForeground : accentColor }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          editable={!locked}
          textAlign="right"
        />
      </View>
    </View>
  );
}

const amtStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
    marginBottom: 1,
  },
  hint: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    minWidth: 110,
  },
  rupee: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginRight: 2,
  },
  input: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
    flex: 1,
    minWidth: 70,
  },
});

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 12,
      paddingBottom: bottomPad + 24,
      gap: 10,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    sectionIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 6,
      backgroundColor: colors.primary + "18",
      justifyContent: "center",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
      flex: 1,
    },
    required: {
      color: "#ef4444",
      fontSize: 14,
      fontFamily: "DMSans_500Medium",
    },
    optional: {
      fontSize: 11,
      fontFamily: "DMSans_400Regular",
    },
    parlorSelector: {
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 12,
      minHeight: 52,
      justifyContent: "center",
    },
    parlorSelectedContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    parlorSelectedName: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
      marginBottom: 3,
    },
    parlorSelectedMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    parlorCode: {
      fontSize: 11,
      fontFamily: "DMSans_400Regular",
    },
    typeBadge: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: "500" as const,
      fontFamily: "DMSans_500Medium",
    },
    statusBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    parlorPlaceholderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    parlorPlaceholder: {
      flex: 1,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
    },
    lockBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    lockText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
    },
    fieldDivider: {
      height: 1,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      marginTop: 4,
      borderTopWidth: 1,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: "500" as const,
      fontFamily: "DMSans_500Medium",
    },
    totalAmount: {
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "DMSans_700Bold",
    },
    notesInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      minHeight: 72,
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: 10,
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
    emptyPrompt: {
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: "dashed",
      padding: 32,
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    emptyIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    emptyDesc: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      textAlign: "center",
      lineHeight: 18,
    },
    // Modal
    pickerModal: {
      flex: 1,
    },
    pickerHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "DMSans_700Bold",
    },
    pickerSub: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      marginTop: 2,
    },
    pickerCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
    },
    searchBar: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    searchInput: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchText: {
      flex: 1,
      fontSize: 15,
      fontFamily: "DMSans_400Regular",
    },
    parlorRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 10,
    },
    parlorRowIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    parlorRowName: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
      marginBottom: 3,
    },
    parlorRowMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    parlorRowCode: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
    searchEmpty: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 10,
    },
    searchEmptyText: {
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
    },
  });
}
