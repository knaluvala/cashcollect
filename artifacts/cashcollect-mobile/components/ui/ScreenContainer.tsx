import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
} & ScrollViewProps;

export function ScreenContainer({
  children,
  style,
  contentStyle,
  ...props
}: ScreenContainerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 24,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});