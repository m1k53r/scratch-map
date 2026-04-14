import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://172.22.234.113:8080",
  plugins: [
    expoClient({
      scheme: "gridwars",
      storagePrefix: "gridwars",
      storage: SecureStore,
    }),
  ],
});
