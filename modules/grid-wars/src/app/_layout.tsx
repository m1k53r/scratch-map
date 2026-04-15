import { ReactQueryClient } from "@/lib/react-query-client";
import { Stack } from "expo-router";
import { SplashScreenController } from "../splash";
import { authClient } from "@/lib/auth-client";

export default function Root() {
  return (
    <ReactQueryClient>
      <SplashScreenController />
      <RootNavigator />
    </ReactQueryClient>
  );
}

function RootNavigator() {
  const { data } = authClient.useSession();

  return (
    <Stack>
      <Stack.Protected guard={!!data}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!data}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
