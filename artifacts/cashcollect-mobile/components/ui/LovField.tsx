import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type LovFieldProps = {
  label?: string;
  valueLabel: string;
  valueSubLabel?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export function LovField({
  label,
  valueLabel,
  valueSubLabel,
  placeholder = "Select value",
  helperText,
  required = false,
  disabled = false,
  icon = "search",
  onPress,
}: LovFieldProps) {
  const colors = useColors();
  const hasValue = Boolean(valueLabel);

  return (
    <View>
      {label || required ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[styles.label, { color: colors.foreground }]}>
              {label}
            </Text>
          ) : null}
          {required ? <Text style={styles.required}>*</Text> : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.field,
          {
            borderColor: hasValue ? colors.primary : colors.border,
            backgroundColor: disabled ? colors.muted : colors.background,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: hasValue
                ? colors.primary + "18"
                : colors.muted,
            },
          ]}
        >
          <Feather
            name={icon}
            size={16}
            color={hasValue ? colors.primary : colors.mutedForeground}
          />
        </View>

        <View style={styles.valueWrap}>
          <Text
            style={[
              styles.value,
              {
                color: hasValue
                  ? colors.foreground
                  : colors.mutedForeground,
              },
            ]}
            numberOfLines={1}
          >
            {hasValue ? valueLabel : placeholder}
          </Text>

          {valueSubLabel || helperText ? (
            <Text
              style={[styles.subValue, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {valueSubLabel || helperText}
            </Text>
          ) : null}
        </View>

        <Feather
          name="chevron-down"
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "DMSans_600SemiBold",
  },
  required: {
    color: "#ef4444",
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  field: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  valueWrap: {
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "DMSans_600SemiBold",
  },
  subValue: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
});