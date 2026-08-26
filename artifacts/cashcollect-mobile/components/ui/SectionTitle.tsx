import React from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
};

export function SectionTitle({
  title,
  subtitle,
  rightComponent,
  style,
}: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
});