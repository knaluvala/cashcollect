import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collection">
        <Icon sf={{ default: "clipboard", selected: "clipboard.fill" }} />
        <Label>Collection</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Reports</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon
          sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }}
        />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { isSyncing, lastSyncedCount } = useOfflineSync();
  const { isOnline } = useNetworkStatus();

  return (
    <View style={{ flex: 1 }}>
      {!isOnline && (
        <View style={[styles.syncBanner, { backgroundColor: "#ef4444" }]}>
          <Text style={styles.syncBannerText}>
            Offline — records will sync later
          </Text>
        </View>
      )}

      {isOnline && (isSyncing || lastSyncedCount > 0) && (
        <View style={[styles.syncBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.syncBannerText}>
            {isSyncing
              ? "Syncing offline records..."
              : `${lastSyncedCount} offline record(s) synced`}
          </Text>
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.background },
                ]}
              />
            ) : null,
          tabBarLabelStyle: {
            fontFamily: "DMSans_500Medium",
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={24} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="collection"
          options={{
            title: "Collection",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="clipboard" tintColor={color} size={24} />
              ) : (
                <Feather name="clipboard" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="chart.bar" tintColor={color} size={24} />
              ) : (
                <Feather name="bar-chart-2" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView
                  name="ellipsis.circle"
                  tintColor={color}
                  size={24}
                />
              ) : (
                <Feather name="more-horizontal" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  syncBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingVertical: 8,
    alignItems: "center",
  },
  syncBannerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },
});
