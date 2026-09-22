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
import { useAuth } from "@/context/AuthContext";
import { AppCard } from "@/components/ui/AppCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [userCode, setUserCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loginWithAccount(userCodeVal: string, passwordVal: string) {
    if (!userCodeVal.trim() || !passwordVal.trim()) {
      Alert.alert("Missing details", "Please enter user code and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(userCodeVal.trim(), passwordVal);

      if (!result.success) {
        Alert.alert("Login failed", result.error ?? "Invalid credentials");
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/collection");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin() {
    loginWithAccount(userCode, password);
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
          Record daily collections from every parlor on your route — cash,
          coupons, and card transactions.
        </Text>
      </View>

      {/* Login card */}
      <View style={s.card}>
       <AppCard style={s.loginCardInner}>
        <Text style={s.cardTitle}>Sign in</Text>
        <Text style={s.cardSubtitle}>
          Enter your credentials to continue
        </Text>

        {/* User code / email */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>User Code or Email</Text>
          <TextInput
            style={s.input}
            value={userCode}
            onChangeText={setUserCode}
            placeholder="Enter your user code or email"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="default"
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
        <PrimaryButton
  title="Sign in"
  onPress={handleLogin}
  loading={isLoading}
  style={s.signInBtn}
/>

        <TouchableOpacity
          style={s.forgotPasswordBtn}
          onPress={() =>
            Alert.alert(
              "Forgot Password",
              "Please contact your administrator to reset your password.",
            )
          }
        >
          <Text style={s.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </AppCard>
      </View>

      <View
        style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }}
      />
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
    loginCardInner: {
      padding: 20,
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
      padding: 16,
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
      marginBottom: 4,
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
    forgotPasswordBtn: {
      alignItems: "center",
      paddingVertical: 12,
      marginBottom: 20,
    },
    forgotPasswordText: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.primary,
      fontFamily: "DMSans_500Medium",
    },
  });
}
