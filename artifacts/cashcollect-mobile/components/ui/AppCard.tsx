import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

type AppCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function AppCard({ children, style }: AppCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
