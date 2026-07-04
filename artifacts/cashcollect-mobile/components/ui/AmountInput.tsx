import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  accentColor?: string;
};

export function AmountInput({
  label,
  hint,
  value,
  onChange,
  disabled = false,
  accentColor,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
        {hint ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputWrap,
          {
            borderColor: colors.border,
            backgroundColor: disabled ? colors.muted : colors.background,
          },
        ]}
      >
        <Text style={[styles.currency, { color: colors.mutedForeground }]}>
          ₹
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: disabled
                ? colors.mutedForeground
                : accentColor ?? colors.foreground,
            },
          ]}
          value={value}
          //onChangeText={onChange}
          onChangeText={(text) => onChange(formatAmount(text))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
          textAlign="right"
        />
      </View>
    </View>
  );
}

function formatAmount(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, decimal] = cleaned.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${formattedWhole}.${decimal.slice(0, 2)}` : formattedWhole;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  labelWrap: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
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
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    minWidth: 120,
  },
  currency: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginRight: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
    flex: 1,
    minWidth: 76,
  },
});