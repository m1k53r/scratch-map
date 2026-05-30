import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { View, Button, Text, YStack } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SignIn() {
  const router = useRouter();

  const signIn = async (provider: "github" | "google" | "discord") => {
    const { error } = await authClient.signIn.social({
      provider,
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
      <Text fontSize="$9" fontWeight="bold" marginBottom="$2">
        Grid Wars
      </Text>
      <Text fontSize="$4" color="gray" marginBottom="$8">
        Sign in to start playing
      </Text>

      <YStack width="100%" maxWidth={320} gap="$3">
        <Button
          onPress={() => signIn("google")}
          backgroundColor="white"
          borderWidth={1}
          borderColor="#dadce0"
          color="black"
          fontWeight="600"
          borderRadius="$4"
          pressStyle={{ opacity: 0.8 }}
          icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
        >
          Continue with Google
        </Button>

        <Button
          onPress={() => signIn("github")}
          backgroundColor="#24292e"
          color="white"
          fontWeight="600"
          borderRadius="$4"
          pressStyle={{ opacity: 0.8 }}
          icon={<Ionicons name="logo-github" size={20} color="white" />}
        >
          Continue with GitHub
        </Button>

        <Button
          onPress={() => signIn("discord")}
          backgroundColor="#5865F2"
          color="white"
          fontWeight="600"
          borderRadius="$4"
          pressStyle={{ opacity: 0.8 }}
          icon={<Ionicons name="logo-discord" size={20} color="white" />}
        >
          Continue with Discord
        </Button>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
});
