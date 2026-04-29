import { StyleSheet } from "react-native";
import { Text, View } from "tamagui";
import { authClient } from "@/lib/auth-client";

export default function Profile() {
  const { data: session } = authClient.useSession();

  return (
    <View style={styles.container}>
      <Text>Welcome, {session?.user.name}</Text>
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
