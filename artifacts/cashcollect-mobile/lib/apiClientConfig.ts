import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");
export const AUTH_TOKEN_STORAGE_KEY = "@cashcollect_mobile_token";
export const AUTH_USER_STORAGE_KEY = "@cashcollect_mobile_user";

setBaseUrl(API_BASE_URL || null);
setAuthTokenGetter(() => AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
