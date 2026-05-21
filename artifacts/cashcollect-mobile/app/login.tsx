import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
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
import { useAuth, UserRole } from "@/context/AuthContext";
import { DEMO_ACCOUNTS } from "@/data/mockData";

type RoleTab = "agent" | "supervisor" | "superadmin";

const ROLE_LABELS: Record<RoleTab, string> = {
  agent: "Agent",
  supervisor: "Supervisor",
  superadmin: "Super Admin",
};

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<RoleTab>("agent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function autofill(role: RoleTab) {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
      setActiveRole(role);
      Haptics.selectionAsync();
    }
  }

  async function handleLogin() {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password
    );
    if (!account) {
      Alert.alert("Invalid credentials", "Please check your email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await login({
        role: account.role as UserRole,
        name: account.name,
        email: account.email,
        code: account.code,
        route: account.route,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/collection");
    } finally {
      setIsLoading(false);
    }
  }

  const s = makeStyles(colors, topPad);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header brand panel */}
      <View style={s.brandPanel}>
        <View style={s.logoRow}>
          <View style={s.logoBox}>
            <Feather name="arrow-up" size={18} color="#fff" />
          </View>
          <Text style={s.brandName}>CashCollect</Text>
        </View>
        <Text style={s.brandTagline}>
          Ice Cream Parlor{"\n"}
          <Text style={s.brandAccent}>Cash Collection</Text>
          {"\n"}Made Simple
        </Text>
        <Text style={s.brandDesc}>
          Record daily collections from every parlor on your route — cash, coupons, and card transactions.
        </Text>
      </View>

      {/* Login card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Sign in</Text>
        <Text style={s.cardSubtitle}>Select your role and enter your credentials</Text>

        {/* Role tabs */}
        <View style={s.roleTabs}>
          {(["agent", "supervisor", "superadmin"] as RoleTab[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[s.roleTab, activeRole === role && s.roleTabActive]}
              onPress={() => { setActiveRole(role); Haptics.selectionAsync(); }}
            >
              <Text style={[s.roleTabText, activeRole === role && s.roleTabTextActive]}>
                {ROLE_LABELS[role]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Email address</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="yourname@cashcollect.in"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Password</Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign in button */}
        <TouchableOpacity
          style={[s.signInBtn, isLoading && s.signInBtnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <Text style={s.signInBtnText}>Signing in...</Text>
          ) : (
            <Text style={s.signInBtnText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Demo accounts */}
        <View style={s.demoSection}>
          <Text style={s.demoTitle}>DEMO ACCOUNTS — TAP TO AUTOFILL</Text>
          {DEMO_ACCOUNTS.map((acc) => (
            <TouchableOpacity
              key={acc.role}
              style={s.demoRow}
              onPress={() => autofill(acc.role as RoleTab)}
              activeOpacity={0.7}
            >
              <View style={s.demoLeft}>
                <Text style={s.demoLabel}>{acc.label}</Text>
                <Text style={s.demoEmail}>{acc.email}</Text>
              </View>
              <View style={s.demoBadge}>
                <Text style={s.demoBadgeText}>{acc.password}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }} />
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    content: {
      flexGrow: 1,
    },
    brandPanel: {
      paddingTop: topPad + 24,
      paddingHorizontal: 24,
      paddingBottom: 32,
      backgroundColor: colors.primary,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    logoBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    brandName: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "DMSans_700Bold",
    },
    brandTagline: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: "#ffffff",
      lineHeight: 34,
      fontFamily: "DMSans_700Bold",
      marginBottom: 12,
    },
    brandAccent: {
      color: colors.accent,
    },
    brandDesc: {
      fontSize: 14,
      color: "rgba(255,255,255,0.75)",
      lineHeight: 20,
      fontFamily: "DMSans_400Regular",
    },
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "DMSans_700Bold",
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
      marginBottom: 20,
    },
    roleTabs: {
      flexDirection: "row",
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      padding: 3,
      marginBottom: 20,
    },
    roleTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: colors.radius - 2,
    },
    roleTabActive: {
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    roleTabText: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.mutedForeground,
      fontFamily: "DMSans_500Medium",
    },
    roleTabTextActive: {
      color: colors.foreground,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    fieldGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.foreground,
      fontFamily: "DMSans_500Medium",
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.card,
      fontFamily: "DMSans_400Regular",
      marginBottom: 0,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    eyeBtn: {
      padding: 12,
    },
    signInBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
      marginBottom: 24,
    },
    signInBtnDisabled: {
      opacity: 0.6,
    },
    signInBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "DMSans_600SemiBold",
    },
    demoSection: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 12,
      backgroundColor: colors.muted,
    },
    demoTitle: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      letterSpacing: 0.5,
      fontFamily: "DMSans_700Bold",
      marginBottom: 10,
    },
    demoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    demoLeft: {
      flex: 1,
    },
    demoLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "DMSans_600SemiBold",
    },
    demoEmail: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
      marginTop: 1,
    },
    demoBadge: {
      backgroundColor: colors.secondary,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    demoBadgeText: {
      fontSize: 11,
      color: colors.secondaryForeground,
      fontFamily: "DMSans_500Medium",
      fontWeight: "500" as const,
    },
  });
}
