import { treaty } from "@elysiajs/eden";
import type { App } from "@gridwars/types";
import { authClient } from "./auth-client";

const cookies = authClient.getCookie();

export const client = treaty<App>(process.env.EXPO_PUBLIC_BACKEND_URL!, {
  headers: {
    Cookie: cookies,
  },
  fetch: {
    credentials: "omit",
  },
});
