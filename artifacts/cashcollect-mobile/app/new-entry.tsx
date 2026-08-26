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
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { addOfflineCollection } from "@/lib/offlineQueue";
import {
  ParlorEntry,
  CollectionStatus,
  formatINR,
} from "@/lib/collectionTypes";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { AmountInput } from "@/components/ui/AmountInput";

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

export default function NewEntryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [parlors, setParlors] = useState<ParlorEntry[]>([]);
  const [isLoadingParlors, setIsLoadingParlors] = useState(false);

  const [search, setSearch] = useState("");
  const [parlorPickerOpen, setParlorPickerOpen] = useState(false);
  const [selectedParlor, setSelectedParlor] = useState<ParlorEntry | null>(
    null,
  );
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [cash, setCash] = useState("");
  const [coupon, setCoupon] = useState("");
  const [cc, setCC] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCollectionId, setSavedCollectionId] = useState<number | null>(
    null,
  );

  React.useEffect(() => {
    async function loadParlors() {
      setIsLoadingParlors(true);

      try {
        const res = await apiFetch("/api/parlors");
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error ?? "Failed to load parlors");
        }

        const mapped: ParlorEntry[] = (result.parlors ?? []).map((p: any) => ({
          id: p.parlorCode,
          parlorCode: p.parlorCode,
          parlorName: p.parlorName,
          parlorType: p.parlorType,
          status: "pending",
          cashAmount: null,
          couponAmount: null,
          ccAmount: null,
          notes: "",
          submittedAt: null,
          acknowledgedAt: null,
          acknowledgedBy: null,
        }));

        setParlors(mapped);
      } catch (error) {
        console.error(error);
        Alert.alert(
          "Load Failed",
          error instanceof Error ? error.message : "Could not load parlors",
        );
      } finally {
        setIsLoadingParlors(false);
      }
    }

    loadParlors();
  }, []);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredParlors = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return parlors;
    return parlors.filter(
      (p) =>
        p.parlorName.toLowerCase().includes(q) ||
        p.parlorCode.toLowerCase().includes(q) ||
        p.parlorType.toLowerCase().includes(q),
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
  const canSubmit = !isReadOnly;

  async function findExistingCollectionId(parlorCode: string, date: string) {
    const res = await apiFetch(
      `/api/collections?date=${date}&parlorCode=${parlorCode}`,
    );

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error ?? "Failed to check existing collection");
    }

    return result.collection?.id ?? null;
  }

  async function handleSaveDraft() {
    if (!selectedParlor || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    const payload = {
      parlorCode: selectedParlor.parlorCode,
      parlorName: selectedParlor.parlorName,
      parlorType: selectedParlor.parlorType,
      routeCode: user.route,
      agentCode: user.agentCode ?? user.code,
      agentName: user.name,
      collectionDate,
      cashAmount: cashNum,
      couponAmount: couponNum,
      ccAmount: ccNum,
      notes,
      status: "entered",
    };

    try {
      const res = await apiFetch("/api/collections", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          const existingId = await findExistingCollectionId(
            selectedParlor.parlorCode,
            collectionDate,
          );

          if (!existingId) {
            throw new Error("Existing collection could not be found");
          }

          const updateRes = await apiFetch(`/api/collections/${existingId}`, {
            method: "PUT",
            body: JSON.stringify({
              cashAmount: cashNum,
              couponAmount: couponNum,
              ccAmount: ccNum,
              notes,
              status: "entered",
            }),
          });

          const updateResult = await updateRes.json();

          if (!updateRes.ok) {
            throw new Error(
              updateResult.error ?? "Failed to update existing draft",
            );
          }

          setSavedCollectionId(existingId);
          setSaved(true);

          Alert.alert(
            "Saved",
            `Draft updated for ${selectedParlor.parlorName}`,
          );
          return;
        }

        throw new Error(result.error ?? "Failed to save draft");
      }

      setSavedCollectionId(result.id);
      setSaved(true);
      Alert.alert("Saved", `Draft saved for ${selectedParlor.parlorName}`);
    } catch (error) {
      console.error(error);

      await addOfflineCollection({
        action: "save-draft",
        payload,
      });

      setSaved(true);

      Alert.alert(
        "Saved Offline",
        "Network is unavailable. This draft has been saved on the device and will be synced later.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitCollectionNow() {
    if (!selectedParlor || !user) return;

    setIsSubmitting(true);

    const payload = {
      parlorCode: selectedParlor.parlorCode,
      parlorName: selectedParlor.parlorName,
      parlorType: selectedParlor.parlorType,
      routeCode: user.route,
      agentCode: user.agentCode ?? user.code,
      agentName: user.name,
      collectionDate,
      cashAmount: cashNum,
      couponAmount: couponNum,
      ccAmount: ccNum,
      notes,
      status: "entered",
    };

    try {
      let collectionId = savedCollectionId;

      if (!collectionId) {
        collectionId = await findExistingCollectionId(
          selectedParlor.parlorCode,
          collectionDate,
        );
      }

      if (!collectionId) {
        const saveRes = await apiFetch("/api/collections", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const saveResult = await saveRes.json();

        if (!saveRes.ok) {
          if (saveRes.status === 409) {
            collectionId = await findExistingCollectionId(
              selectedParlor.parlorCode,
              collectionDate,
            );
          } else {
            throw new Error(saveResult.error ?? "Failed to save collection");
          }
        } else {
          collectionId = saveResult.id;
        }
      } else {
        const updateRes = await apiFetch(`/api/collections/${collectionId}`, {
          method: "PUT",
          body: JSON.stringify({
            cashAmount: cashNum,
            couponAmount: couponNum,
            ccAmount: ccNum,
            notes,
            status: "entered",
          }),
        });

        const updateResult = await updateRes.json();

        if (!updateRes.ok) {
          throw new Error(updateResult.error ?? "Failed to update collection");
        }
      }

      if (!collectionId) {
        throw new Error("Collection id is missing");
      }

      setSavedCollectionId(collectionId);

      const submitRes = await apiFetch(
        `/api/collections/${collectionId}/submit`,
        {
          method: "POST",
        },
      );

      const submitResult = await submitRes.json();

      if (!submitRes.ok) {
        throw new Error(submitResult.error ?? "Failed to submit collection");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Submitted", "Collection submitted to supervisor.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error(error);

      await addOfflineCollection({
        action: "submit",
        payload: {
          ...payload,
          status: "submitted",
        },
      });

      Alert.alert(
        "Queued for Sync",
        error instanceof Error
          ? error.message
          : "Your submission has been queued and will sync later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!selectedParlor || !user) return;

    if (!cash && !coupon && !cc) {
      Alert.alert("Incomplete", "Please enter at least one amount.");
      return;
    }

    if (Platform.OS === "web") {
      await submitCollectionNow();
      return;
    }

    Alert.alert(
      "Submit to Supervisor",
      `Submit collection of ${formatINR(total)} for ${selectedParlor.parlorName}? This cannot be edited after submission.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: submitCollectionNow,
        },
      ],
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
        <View
  style={[
    s.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ]}
>
  <DatePickerField
    label="Collection Date"
    value={collectionDate}
    onChange={setCollectionDate}
    required
  />
</View>

        {/* Parlor selector */}
        <View
  style={[
    s.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ]}
>
  <View style={s.sectionHeader}>
    <View style={s.sectionIconWrap}>
      <Feather name="home" size={15} color={colors.primary} />
    </View>
    <Text style={[s.sectionTitle, { color: colors.foreground }]}>
      Parlor Code / Name
    </Text>
    <Text style={s.required}>*</Text>
  </View>

  <TouchableOpacity
    style={[
      s.parlorSelector,
      {
        borderColor: selectedParlor ? colors.primary : colors.border,
        backgroundColor: colors.background,
      },
    ]}
    onPress={() => {
      setParlorPickerOpen(true);
      Haptics.selectionAsync();
    }}
    activeOpacity={0.75}
  >
    {selectedParlor ? (
      <View style={s.parlorSelectedContent}>
        <View style={s.parlorCodePill}>
          <Text style={s.parlorCodePillText}>
            {selectedParlor.parlorCode}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[s.parlorSelectedName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {selectedParlor.parlorName}
          </Text>

          <View style={s.parlorSelectedMeta}>
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
                  <Text style={[s.statusBadgeText, { color: cfg.text }]}>
                    {cfg.label}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        <Feather
          name="chevron-down"
          size={17}
          color={colors.mutedForeground}
        />
      </View>
    ) : (
      <View style={s.parlorPlaceholderRow}>
        <View style={s.parlorCodePillMuted}>
          <Text style={[s.parlorCodePillText, { color: colors.mutedForeground }]}>
            LOV
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[s.parlorPlaceholder, { color: colors.foreground }]}>
            Select parlor from list
          </Text>
          <Text style={[s.parlorHelpText, { color: colors.mutedForeground }]}>
            Search by code, name, or type
          </Text>
        </View>

        <Feather
          name="chevron-down"
          size={17}
          color={colors.mutedForeground}
        />
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
                    backgroundColor:
                      selectedParlor.status === "acknowledged"
                        ? "#d1fae5"
                        : "#ede9fe",
                    borderColor:
                      selectedParlor.status === "acknowledged"
                        ? "#a7f3d0"
                        : "#c4b5fd",
                  },
                ]}
              >
                <Feather
                  name={
                    selectedParlor.status === "acknowledged"
                      ? "check-circle"
                      : "lock"
                  }
                  size={14}
                  color={
                    selectedParlor.status === "acknowledged"
                      ? "#065f46"
                      : "#6d28d9"
                  }
                />
                <Text
                  style={[
                    s.lockText,
                    {
                      color:
                        selectedParlor.status === "acknowledged"
                          ? "#065f46"
                          : "#6d28d9",
                    },
                  ]}
                >
                  {selectedParlor.status === "acknowledged"
                    ? "Acknowledged — no further edits allowed."
                    : "Submitted — awaiting supervisor acknowledgment."}
                </Text>
              </View>
            )}

            {/* Amount inputs */}
            <View
              style={[
                s.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={s.sectionHeader}>
                <View style={s.sectionIconWrap}>
                  <Feather
                    name="dollar-sign"
                    size={15}
                    color={colors.primary}
                  />
                </View>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>
                  Collection Amounts
                </Text>
              </View>

              <AmountInput
  label="Cash Amount"
  hint="Physical currency collected"
  value={cash}
  onChange={setCash}
  disabled={isReadOnly}
  accentColor="#065f46"
/>

<View
  style={[s.fieldDivider, { backgroundColor: colors.border }]}
/>

<AmountInput
  label="Coupon Amount"
  hint="Physical coupons redeemed"
  value={coupon}
  onChange={setCoupon}
  disabled={isReadOnly}
  accentColor="#1d4ed8"
/>

<View
  style={[s.fieldDivider, { backgroundColor: colors.border }]}
/>

<AmountInput
  label="Credit Card Total"
  hint="POS / Card transaction total"
  value={cc}
  onChange={setCC}
  disabled={isReadOnly}
  accentColor="#6d28d9"
/>

              {total > 0 && (
                <View style={[s.totalRow, { borderTopColor: colors.border }]}>
                  <Text
                    style={[s.totalLabel, { color: colors.mutedForeground }]}
                  >
                    Total Collection
                  </Text>
                  <Text style={[s.totalAmount, { color: colors.primary }]}>
                    {formatINR(total)}
                  </Text>
                </View>
              )}
            </View>

            {/* Notes */}
            <View
  style={[
    s.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ]}
>
  <View style={s.sectionHeader}>
    <View style={s.sectionIconWrap}>
      <Feather
        name="file-text"
        size={15}
        color={colors.primary}
      />
    </View>

    <Text style={[s.sectionTitle, { color: colors.foreground }]}>
      Remarks
    </Text>

    <Text
      style={[
        s.optional,
        { color: colors.mutedForeground },
      ]}
    >
      Optional
    </Text>
  </View>

  <Text
    style={[
      s.fieldDescription,
      { color: colors.mutedForeground },
    ]}
  >
    Add any collection notes, POS issues, missing slips or discrepancies.
  </Text>

  <TextInput
    style={[
      s.notesInput,
      {
        borderColor: colors.border,
        backgroundColor: isReadOnly
          ? colors.muted
          : colors.background,
        color: colors.foreground,
      },
    ]}
    value={notes}
    onChangeText={setNotes}
    placeholder="Enter remarks..."
    placeholderTextColor={colors.mutedForeground}
    multiline
    numberOfLines={4}
    editable={!isReadOnly}
  />
</View>

            {/* Actions */}
            {!isReadOnly && (
              <View style={s.actions}>
                <TouchableOpacity
                  style={[
                    s.draftBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  {isSaving ? (
                    <Text
                      style={[
                        s.draftBtnText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Saving…
                    </Text>
                  ) : (
                    <>
                      <Feather
                        name="save"
                        size={15}
                        color={colors.foreground}
                      />
                      <Text
                        style={[s.draftBtnText, { color: colors.foreground }]}
                      >
                        Save Draft
                      </Text>
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
                        <Text style={s.submitBtnText}>
                          Submit to Supervisor
                        </Text>
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
          <View
            style={[
              s.emptyPrompt,
              { borderColor: colors.border, backgroundColor: colors.muted },
            ]}
          >
            <View
              style={[s.emptyIconWrap, { backgroundColor: colors.background }]}
            >
              <Feather name="home" size={22} color={colors.mutedForeground} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              Select a parlor to begin
            </Text>
            <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
              Tap the field above to search and choose a parlor from your
              assigned route
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
          <View
            style={[
              s.pickerHeader,
              { borderBottomColor: colors.border, paddingTop: insets.top + 16 },
            ]}
          >
            <View>
              <Text style={[s.pickerTitle, { color: colors.foreground }]}>
                Select Parlor
              </Text>
              <Text style={[s.pickerSub, { color: colors.mutedForeground }]}>
                {parlors.length} parlors available
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
          <View
            style={[
              s.searchBar,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
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
                  <Feather
                    name="x-circle"
                    size={15}
                    color={colors.mutedForeground}
                  />
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
                      backgroundColor: isSelected
                        ? colors.primary + "0d"
                        : colors.card,
                    },
                  ]}
                  onPress={() => selectParlor(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.parlorRowIcon,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "20"
                          : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="home"
                      size={16}
                      color={
                        isSelected ? colors.primary : colors.mutedForeground
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.parlorRowName,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.foreground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.parlorName}
                    </Text>
                    <View style={s.parlorRowMeta}>
                      <Text
                        style={[
                          s.parlorRowCode,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {item.parlorCode}
                      </Text>
                      <View
                        style={[s.typeBadge, { backgroundColor: typeCfg?.bg }]}
                      >
                        <Text
                          style={[s.typeBadgeText, { color: typeCfg?.text }]}
                        >
                          {item.parlorType}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}
                  >
                    <Text
                      style={[s.statusBadgeText, { color: statusCfg.text }]}
                    >
                      {statusCfg.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather
                      name="check"
                      size={16}
                      color={colors.primary}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.searchEmpty}>
                <Feather name="search" size={28} color={colors.border} />
                <Text
                  style={[s.searchEmptyText, { color: colors.mutedForeground }]}
                >
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
        <Text style={[amtStyles.label, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[amtStyles.hint, { color: colors.mutedForeground }]}>
          {hint}
        </Text>
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
        <Text style={[amtStyles.rupee, { color: colors.mutedForeground }]}>
          ₹
        </Text>
        <TextInput
          style={[
            amtStyles.input,
            { color: locked ? colors.mutedForeground : accentColor },
          ]}
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

function makeStyles(
  colors: ReturnType<typeof useColors>,
  topPad: number,
  bottomPad: number,
) {
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
    fieldDescription: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
      marginBottom: 10,
      lineHeight: 18,
    },
    parlorCodePill: {
      minWidth: 64,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    parlorCodePillMuted: {
      minWidth: 64,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    parlorCodePillText: {
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "DMSans_700Bold",
      color: colors.primary,
    },
    parlorHelpText: {
      fontSize: 11,
      fontFamily: "DMSans_400Regular",
      marginTop: 2,
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
