import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useOfflineSync();
  useEffect(() => {
    const timer = setInterval(async () => {
      const token = await AsyncStorage.getItem("@cashcollect_mobile_token");

      if (!token) {
        router.replace("/login");
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="entry/[id]"
        options={{
          title: "Collection Entry",
          headerBackTitle: "Back",
          headerTintColor: "#0f4c81",
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="parlor-master"
        options={{
          title: "Parlor Master",
          headerBackTitle: "Back",
          headerTintColor: "#0f4c81",
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="new-entry"
        options={{
          title: "New Collection Entry",
          headerBackTitle: "Back",
          headerTintColor: "#0f4c81",
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="route-master"
        options={{
          title: "Route Master",
          headerBackTitle: "Back",
          headerTintColor: "#0f4c81",
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: "User Management",
          headerBackTitle: "Back",
          headerTintColor: "#0f4c81",
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
