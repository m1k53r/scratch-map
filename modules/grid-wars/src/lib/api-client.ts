import { treaty } from "@elysiajs/eden";
import type { App } from "@gridwars/types";

export const client = treaty<App>(process.env.EXPO_PUBLIC_BACKEND_URL!);
