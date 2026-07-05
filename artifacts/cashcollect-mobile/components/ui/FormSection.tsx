import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { AppCard } from "./AppCard";

type Props = {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  required?: boolean;
  optional?: boolean;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function FormSection({
  title,
  icon,
  required = false,
  optional = false,
  description,
  children,
  style,
}: Props) {
  const colors = useColors();

  return (
    <AppCard style={style}>
      <View style={styles.header}>
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Feather name={icon} size={15} color={colors.primary} />
          </View>
        ) : null}

        <Text style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>

        {required ? <Text style={styles.required}>*</Text> : null}

        {optional ? (
          <Text style={[styles.optional, { color: colors.mutedForeground }]}>
            Optional
          </Text>
        ) : null}
      </View>

      {description ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      ) : null}

      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
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
  description: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 10,
    lineHeight: 18,
  },
});