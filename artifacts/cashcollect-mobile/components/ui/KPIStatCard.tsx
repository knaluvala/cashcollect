import React from "react";
import { Text, StyleSheet } from "react-native";
import { AppCard } from "./AppCard";
import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: string | number;
  valueColor?: string;
};

export function KPIStatCard({
  label,
  value,
  valueColor,
}: Props) {
  const colors = useColors();

  return (
    <AppCard
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 14,
      }}
    >
      <Text
        style={[
          styles.value,
          {
            color: valueColor ?? colors.primary,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.label,
          {
            color: colors.mutedForeground,
          },
        ]}
      >
        {label}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  value: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },

  label: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
});