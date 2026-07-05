import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

function toISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function parseISODate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDisplayDate(value: string) {
  return parseISODate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DatePickerField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseISODate(value), [value]);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      setOpen(false);
    }

    if (event.type === "dismissed" || !date) {
      return;
    }

    onChange(toISODate(date));
  }

  return (
    <View>
      <View style={styles.labelRow}>
      {label ? (
  <Text style={[styles.label, { color: colors.foreground }]}>
    {label}
  </Text>
) : null}
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.field,
          {
            backgroundColor: disabled ? colors.muted : colors.background,
            borderColor: colors.border,
          },
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <Feather name="calendar" size={18} color={colors.primary} />

        <View style={styles.valueWrap}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {formatDisplayDate(value)}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {value}
          </Text>
        </View>

        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {open && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      )}
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
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueWrap: {
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "DMSans_600SemiBold",
  },
  meta: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
});