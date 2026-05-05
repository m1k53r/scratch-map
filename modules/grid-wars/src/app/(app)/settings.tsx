import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { Button, View } from "tamagui";
import { useTheme } from "@/stores/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Settings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();

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
      <Button onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
        <Ionicons
          name={theme === "dark" ? "sunny" : "moon"}
          size={32}
          color={theme === "dark" ? "#fff" : "#000"}
        />
      </Button>
      <Button onPress={logout}>Logout</Button>
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
