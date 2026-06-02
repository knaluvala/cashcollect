import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

interface MenuRow {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const roleLabel =
    user?.role === "agent"
      ? "Collection Agent"
      : user?.role === "supervisor"
      ? "Supervisor"
      : "Super Admin";

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  const menuSections: { title: string; items: MenuRow[] }[] = [
    {
      title: "OPERATIONS",
      items: [
        {
          icon: "clipboard",
          label: "Daily Collection",
          subtitle: "Record and track collections",
          onPress: () => {
            Haptics.selectionAsync();
            router.push("/(tabs)/collection");
          },
        },
        {
          icon: "bar-chart-2",
          label: "Reports",
          subtitle: "View collection reports",
          onPress: () => {
            Haptics.selectionAsync();
            router.push("/(tabs)/reports");
          },
        },
      ],
    },
    {
      title: "ADMINISTRATION",
      items: [
        {
          icon: "upload",
          label: "Parlor Master",
          subtitle: "Bulk upload parlor data",
          onPress: () => {
            Haptics.selectionAsync();
            router.push("/parlor-master");
          },
          hidden: user?.role !== "superadmin",
        },
        {
          icon: "users",
          label: "User Management",
          subtitle: "Manage agents and supervisors",
          onPress: () => Alert.alert("Coming Soon", "User management will be available in a future update."),
          hidden: user?.role === "agent",
        },
        {
          icon: "settings",
          label: "Settings",
          subtitle: "App preferences",
          onPress: () => Alert.alert("Coming Soon", "Settings will be available in a future update."),
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          icon: "log-out",
          label: "Sign out",
          onPress: handleLogout,
          destructive: true,
        },
      ],
    },
  ];

  const s = makeStyles(colors, topPad, insets.bottom);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile card */}
      <View style={[s.profileCard, { backgroundColor: colors.primary }]}>
        <View style={s.profileTopRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user?.name ?? "User"}</Text>
            <Text style={s.profileRole}>{roleLabel}</Text>
            <Text style={s.profileEmail}>{user?.email ?? ""}</Text>
          </View>
        </View>
        {user?.code ? (
          <View style={s.profileMeta}>
            {user.code && (
              <View style={s.metaChip}>
                <Text style={s.metaChipText}>{user.code}</Text>
              </View>
            )}
            {user.route && (
              <View style={s.metaChip}>
                <Text style={s.metaChipText}>Route {user.route}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* Menu sections */}
      {menuSections.map((section) => {
        const visibleItems = section.items.filter((item) => !item.hidden);
        if (visibleItems.length === 0) return null;
        return (
          <View key={section.title} style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title}
            </Text>
            <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {visibleItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    s.menuRow,
                    idx < visibleItems.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.menuIcon,
                      {
                        backgroundColor: item.destructive ? "#fee2e2" : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={18}
                      color={item.destructive ? "#ef4444" : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.menuLabel,
                        {
                          color: item.destructive ? "#ef4444" : colors.foreground,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={[s.menuSub, { color: colors.mutedForeground }]}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <Text style={[s.version, { color: colors.mutedForeground }]}>
        CashCollect v1.0.0
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: Platform.OS === "web" ? 34 + 84 : bottomPad + 84,
    },
    profileCard: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    profileTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 12,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "DMSans_700Bold",
    },
    profileName: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "DMSans_700Bold",
    },
    profileRole: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 13,
      fontFamily: "DMSans_500Medium",
      fontWeight: "500" as const,
    },
    profileEmail: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
    profileMeta: {
      flexDirection: "row",
      gap: 8,
    },
    metaChip: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    metaChipText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    section: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: 0.5,
      fontFamily: "DMSans_700Bold",
      marginBottom: 8,
    },
    sectionCard: {
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: "500" as const,
      fontFamily: "DMSans_500Medium",
    },
    menuSub: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
      marginTop: 1,
    },
    version: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
      marginTop: 24,
      marginBottom: 8,
    },
  });
}
