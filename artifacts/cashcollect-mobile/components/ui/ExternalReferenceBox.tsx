import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { formatAED } from "@/lib/collectionTypes";

type Props = {
  value: number | null;
  source?: string;
  isLoading: boolean;
  error: string | null;
};

export function ExternalReferenceBox({
  value,
  source,
  isLoading,
  error,
}: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.box,
        { borderColor: colors.border, backgroundColor: colors.muted },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          EXTERNAL SYSTEM
        </Text>
        <Feather name="database" size={11} color={colors.mutedForeground} />
      </View>

      {isLoading ? (
        <View style={[styles.skeleton, { backgroundColor: colors.border }]} />
      ) : error ? (
        <Text style={styles.errorText} numberOfLines={2}>
          {error}
        </Text>
      ) : (
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {formatAED(value ?? 0)}
          </Text>
          <Text
            style={[styles.source, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {source ?? "External source"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    fontFamily: "DMSans_700Bold",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  source: {
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
    marginLeft: 8,
    flexShrink: 1,
    textAlign: "right",
  },
  errorText: {
    fontSize: 11,
    color: "#b45309",
    fontFamily: "DMSans_400Regular",
    lineHeight: 15,
  },
  skeleton: {
    height: 16,
    borderRadius: 4,
  },
});
