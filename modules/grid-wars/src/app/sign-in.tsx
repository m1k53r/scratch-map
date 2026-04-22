import { client } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { View, StyleSheet, Button } from "react-native";

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
    <View style={styles.container}>
      <Button title="Login with Github" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
