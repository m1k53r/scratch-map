import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { expo } from "@better-auth/expo";
import { account, session, user, verification } from "./db/schema";

export const auth = betterAuth({
  plugins: [expo()],
  trustedOrigins: ["gridwars://", "exp://"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      session,
      account,
      user,
      verification,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
