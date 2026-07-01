import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { apiFetch } from "@/lib/api";

interface ParlorRow {
  code: string;
  name: string;
  type: string;
  route: string;
  status: "valid" | "error";
  errorMsg?: string;
}

type UploadState = "idle" | "preview" | "uploading" | "done";

export default function ParlorMasterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [data, setData] = useState<ParlorRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { user } = useAuth();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  async function loadParlors() {
    setIsLoading(true);
    setLoadError("");

    try {
      const res = await apiFetch("/api/parlors");

      if (!res.ok) {
        throw new Error(`Parlors API failed: ${res.status}`);
      }

      const result = await res.json();
      const rows: ParlorRow[] = Array.isArray(result.parlors)
        ? result.parlors.map((p: any) => ({
            code: p.parlorCode ?? "",
            name: p.parlorName ?? "",
            type: p.parlorType ?? "",
            route: p.routeCode ?? "",
            status: "valid" as const,
          }))
        : [];

      setData(rows);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load parlors",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handlePickFile() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Excel Import Coming Next",
      "Parlor import will be connected during the Excel Import / Export phase.",
    );
  }

  function handleUpload() {
    const errors = data.filter((r) => r.status === "error");
    if (errors.length > 0) {
      Alert.alert(
        "Validation errors",
        `${errors.length} row(s) have errors. Fix them before uploading.`,
      );
      return;
    }
    setUploadState("uploading");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      setUploadState("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }

  function handleReset() {
    setUploadState("idle");
    setData([]);
    Haptics.selectionAsync();
  }

  useEffect(() => {
    loadParlors();
  }, []);

  const validCount = data.filter((r) => r.status === "valid").length;
  const errorCount = data.filter((r) => r.status === "error").length;

  if (!hasPermission(user?.role, "parlor-master:view")) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text>Access Restricted</Text>
        <Text>You do not have permission to access Parlor Master.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Info card */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.infoIcon, { backgroundColor: "#dbeafe" }]}>
          <Feather name="database" size={22} color="#1d4ed8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Parlor Master Upload
          </Text>
          <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
            Upload an Excel (.xlsx) or CSV file to update the parlor master
            data. Required columns: Parlor Code, Name, Type, Route.
          </Text>
        </View>
      </View>

      {isLoading && (
        <View
          style={[
            styles.dropZone,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <Text style={[styles.dropTitle, { color: colors.foreground }]}>
            Loading parlors...
          </Text>
        </View>
      )}

      {loadError ? (
        <View
          style={[
            styles.dropZone,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <Text style={[styles.dropTitle, { color: colors.foreground }]}>
            Unable to load parlors
          </Text>
          <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
            {loadError}
          </Text>
        </View>
      ) : null}

      {!isLoading && !loadError && uploadState === "idle" && (
        <View
          style={[
            styles.dropZone,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <Feather
            name="upload-cloud"
            size={40}
            color={colors.mutedForeground}
          />
          <Text style={[styles.dropTitle, { color: colors.foreground }]}>
            Upload Parlor Master File
          </Text>
          <Text style={[styles.dropHint, { color: colors.mutedForeground }]}>
            Supports .xlsx and .csv files up to 5 MB
          </Text>
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={handlePickFile}
            activeOpacity={0.8}
          >
            <Feather name="upload" size={16} color="#fff" />
            <Text style={styles.uploadBtnText}>Import File</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !loadError && data.length > 0 && (
        <>
          {/* Stats row */}
          <View
            style={[
              styles.statsRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <StatChip
              label="Parlors"
              value={data.length.toString()}
              color={colors.foreground}
            />
            <StatChip
              label="Valid"
              value={validCount.toString()}
              color="#065f46"
            />
            <StatChip
              label="Errors"
              value={errorCount.toString()}
              color={errorCount > 0 ? "#ef4444" : "#065f46"}
            />
          </View>

          {/* Preview table */}
          <View
            style={[
              styles.tableCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.tableTitle, { color: colors.foreground }]}>
              Preview ({data.length} rows)
            </Text>
            {/* Header */}
            <View
              style={[
                styles.tableHeaderRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
            >
              <Text style={[styles.thCode, { color: colors.mutedForeground }]}>
                Code
              </Text>
              <Text style={[styles.thName, { color: colors.mutedForeground }]}>
                Name
              </Text>
              <Text style={[styles.thType, { color: colors.mutedForeground }]}>
                Type
              </Text>
              <Text
                style={[styles.thStatus, { color: colors.mutedForeground }]}
              >
                Status
              </Text>
            </View>
            {data.map((row, idx) => (
              <View
                key={`${row.code}-${idx}`}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  row.status === "error" && { backgroundColor: "#fff1f2" },
                ]}
              >
                <Text
                  style={[styles.tdCode, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {row.code || "—"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.tdName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>
                  {row.errorMsg && (
                    <Text style={styles.tdError}>{row.errorMsg}</Text>
                  )}
                </View>
                <Text
                  style={[styles.tdType, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {row.type}
                </Text>
                <View style={styles.tdStatusCell}>
                  {row.status === "valid" ? (
                    <Feather name="check-circle" size={16} color="#10b981" />
                  ) : (
                    <Feather name="alert-circle" size={16} color="#ef4444" />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.resetBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.resetBtnText, { color: colors.mutedForeground }]}
              >
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    errorCount > 0 ? colors.mutedForeground : colors.primary,
                },
              ]}
              onPress={handleUpload}
              disabled={uploadState === "uploading" || errorCount > 0}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {uploadState === "uploading"
                  ? "Uploading..."
                  : `Upload ${validCount} Parlors`}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {uploadState === "done" && (
        <View
          style={[
            styles.successCard,
            { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" },
          ]}
        >
          <Feather name="check-circle" size={36} color="#065f46" />
          <Text style={styles.successTitle}>Upload Successful</Text>
          <Text style={[styles.successDesc, { color: "#065f46" }]}>
            {validCount} parlors have been updated in the system.
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              { backgroundColor: "#065f46", marginTop: 16 },
            ]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadBtnText}>Upload Another File</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700" as const,
          color,
          fontFamily: "DMSans_700Bold",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: "#64748b",
          fontFamily: "DMSans_400Regular",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    lineHeight: 18,
  },
  dropZone: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  dropTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  dropHint: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  uploadBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tableCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
    padding: 12,
    paddingBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  thCode: {
    width: 70,
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  thName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  thType: {
    width: 80,
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  thStatus: {
    width: 50,
    fontSize: 11,
    fontWeight: "600" as const,
    textAlign: "center",
    fontFamily: "DMSans_600SemiBold",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tdCode: { width: 70, fontSize: 12, fontFamily: "DMSans_400Regular" },
  tdName: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  tdError: {
    fontSize: 11,
    color: "#ef4444",
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  tdType: { width: 80, fontSize: 12, fontFamily: "DMSans_400Regular" },
  tdStatusCell: { width: 50, alignItems: "center" },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  successCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#065f46",
    fontFamily: "DMSans_700Bold",
  },
  successDesc: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
});
