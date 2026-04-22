import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { Button, StyleSheet, View } from "react-native";

export default function Settings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const logout = async () => {
    router.replace("/");

    const { error } = await authClient.signOut();

    if (error) {
      console.error(error);
      return;
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={logout}></Button>
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
