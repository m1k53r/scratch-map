import { ReactQueryClient } from "@/lib/react-query-client";
import { Stack } from "expo-router";
import { SplashScreenController } from "../splash";
import { authClient } from "@/lib/auth-client";
import { TamaguiProvider, Theme } from "tamagui";
import { config } from "@/../tamagui.config";
import { useTheme } from "@/stores/useTheme";

export default function Root() {
  const { theme } = useTheme();

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>
        <ReactQueryClient>
          <SplashScreenController />
          <RootNavigator />
        </ReactQueryClient>
      </Theme>
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
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
