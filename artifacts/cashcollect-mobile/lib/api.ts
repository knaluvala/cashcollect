import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");
const AUTH_TOKEN_STORAGE_KEY = "@cashcollect_mobile_token";
const AUTH_USER_STORAGE_KEY = "@cashcollect_mobile_user";
const API_TIMEOUT_MS = 15000;
const API_RETRY_COUNT = 2;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  //  const controller = new AbortController();
  // const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= API_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (response.status < 500) {
        break;
      }
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < API_RETRY_COUNT) {
      await delay(500 * (attempt + 1));
    }
  }

  if (!response) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Network request failed");
  }

  if (response.status === 401) {
    await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  return response;
}
