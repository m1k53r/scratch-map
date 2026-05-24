import { client } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { View, Button } from "tamagui";

export default function SignIn() {
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/app",
    });

    if (error) {
      console.error(error);
      return;
    }

    router.replace({ pathname: "/(app)" });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button onPress={handleLogin}>Login with Github</Button>
    </View>
  );
}
