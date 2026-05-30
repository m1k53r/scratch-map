import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
  plugins: [
    expoClient({
      scheme: "gridwars",
      storagePrefix: "gridwars",
      storage: SecureStore,
    }),
  ],
  customFetchImpl: async (url, init) => {
    const headers = new Headers(init?.headers);
    if (!headers.has("x-device-id")) {
      headers.set("x-device-id", Device.osBuildId ?? "expo-client");
    }
    if (!headers.has("x-device-name")) {
      headers.set("x-device-name", Device.modelName ?? Device.deviceName ?? "Expo Client");
    }
    return fetch(url, { ...init, headers });
  },
});
