import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/stores/useTheme";
import { useState, useEffect } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Button,
  Image,
  Input,
  Text,
  View,
  YStack,
  Spinner,
} from "tamagui";
import { toast, Toast } from "@tamagui/toast/v2";
import ToastList from "@/components/ToastList";

export default function Profile() {
  const { data: session } = authClient.useSession();
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name);
    }
  }, [session?.user.id]);

  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f2f2f7";
  const cardBg = isDark ? "#1c1c1e" : "#ffffff";
  const labelColor = isDark ? "#8e8e93" : "#6c6c70";
  const textColor = isDark ? "#ffffff" : "#000000";
  const borderColor = isDark ? "#3a3a3c" : "#e5e5ea";

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    setLoading(false);
    if (error) {
      toast("Could not save", { description: error.message ?? "Something went wrong" });
    } else {
      toast("Profile updated");
    }
  };

  const initials = session?.user.name
    ? session.user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Toast position="top-center" theme={theme} visibleToasts={1}>
      <ToastList setFormMode={() => {}} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container} backgroundColor={bg}>
          {session?.user.image ? (
            <Image
              src={session.user.image}
              style={styles.avatarCircle}
            />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: "#e53e3e" }]}>
              <Text color="white" fontSize="$8" fontWeight="bold" letterSpacing={1}>
                {initials}
              </Text>
            </View>
          )}

          <Text fontSize="$6" fontWeight="bold" color={textColor} marginBottom="$6">
            {session?.user.name}
          </Text>

          <YStack
            width="100%"
            maxWidth={400}
            gap="$0"
            borderRadius="$4"
            overflow="hidden"
            borderWidth={1}
            borderColor={borderColor}
            backgroundColor={cardBg}
          >
            <YStack padding="$3" gap="$1" borderBottomWidth={1} borderBottomColor={borderColor}>
              <Text style={{ color: labelColor, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Name
              </Text>
              <Input
                unstyled
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                color={textColor}
                fontSize="$4"
                style={{ color: textColor }}
                placeholderTextColor={labelColor as any}
                backgroundColor="transparent"
              />
            </YStack>

            <YStack padding="$3" gap="$1">
              <Text style={{ color: labelColor, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Email
              </Text>
              <Text style={{ color: labelColor, fontSize: 15 }}>
                {session?.user.email}
              </Text>
              <Text style={{ color: labelColor, fontSize: 11 }}>
                Managed by your sign-in provider
              </Text>
            </YStack>
          </YStack>

          <Button
            marginTop="$5"
            width="100%"
            maxWidth={400}
            backgroundColor="#e53e3e"
            color="white"
            fontWeight="bold"
            borderRadius="$4"
            onPress={save}
            disabled={loading}
            pressStyle={{ opacity: 0.8 }}
          >
            {loading ? <Spinner color="white" /> : "Save changes"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Toast>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
