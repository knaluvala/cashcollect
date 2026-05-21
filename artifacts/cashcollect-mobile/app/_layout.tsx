import {
  DM_Sans_400Regular,
  DM_Sans_500Medium,
  DM_Sans_600SemiBold,
  DM_Sans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular: DM_Sans_400Regular,
    DMSans_500Medium: DM_Sans_500Medium,
    DMSans_600SemiBold: DM_Sans_600SemiBold,
    DMSans_700Bold: DM_Sans_700Bold,
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
