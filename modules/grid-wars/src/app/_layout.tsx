import { ReactQueryClient } from "@/lib/react-query-client";
import { Stack } from "expo-router";
import { SplashScreenController } from "../splash";
import { authClient } from "@/lib/auth-client";
import { TamaguiProvider, Theme } from "tamagui";
import { config } from "@/../tamagui.config";

export default function Root() {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <ReactQueryClient>
        <SplashScreenController />
        <RootNavigator />
      </ReactQueryClient>
    </TamaguiProvider>
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
