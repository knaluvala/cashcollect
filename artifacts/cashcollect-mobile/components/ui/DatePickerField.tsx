import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseISODate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
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
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => parseISODate(value), [value]);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setIsOpen(false);
    }

    if (event.type === "dismissed" || !selected) {
      return;
    }

    onChange(toISODate(selected));
  }

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
            borderColor: colors.border,
            backgroundColor: disabled ? colors.muted : colors.background,
          },
        ]}
        activeOpacity={0.75}
        disabled={disabled}
        onPress={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primary + "18" },
          ]}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
        </View>

        <View style={styles.valueWrap}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {formatDisplayDate(value)}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {value}
          </Text>
        </View>

        <Feather
          name="chevron-down"
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {isOpen ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      ) : null}
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
  meta: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
});