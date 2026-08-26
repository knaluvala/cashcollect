import React from "react";
import { Text, View, StyleSheet } from "react-native";

type StatusBadgeProps = {
  label: string;
  backgroundColor: string;
  color: string;
};

export function StatusBadge({
  label,
  backgroundColor,
  color,
}: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },
});
