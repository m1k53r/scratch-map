import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { StyleSheet, Switch } from "react-native";
import { Text, View, YStack, XStack } from "tamagui";
import { useTheme } from "@/stores/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

type RowProps = {
  icon: string;
  label: string;
  isDark: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
};

function SettingsRow({ icon, label, isDark, right, onPress, destructive }: RowProps) {
  const textColor = destructive ? "#e53e3e" : (isDark ? "#ffffff" : "#000000");
  const iconColor = destructive ? "#e53e3e" : (isDark ? "#ffffff" : "#3c3c43");

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        gap="$3"
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text flex={1} fontSize="$4" color={textColor}>
          {label}
        </Text>
        {right}
      </XStack>
    </Pressable>
  );
}

type SectionProps = {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  borderColor: string;
  cardBg: string;
};

function Section({ title, isDark, children, borderColor, cardBg }: SectionProps) {
  return (
    <YStack width="100%" maxWidth={400} gap="$1">
      <Text
        fontSize="$2"
        color={isDark ? "#8e8e93" : "#6c6c70"}
        textTransform="uppercase"
        letterSpacing={1}
        paddingLeft="$2"
        paddingBottom="$1"
      >
        {title}
      </Text>
      <YStack
        borderRadius="$4"
        overflow="hidden"
        borderWidth={1}
        borderColor={borderColor}
        backgroundColor={cardBg}
      >
        {children}
      </YStack>
    </YStack>
  );
}

function Divider({ color }: { color: string }) {
  return <View height={1} backgroundColor={color} marginLeft={52} />;
}

export default function Settings() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f2f2f7";
  const cardBg = isDark ? "#1c1c1e" : "#ffffff";
  const borderColor = isDark ? "#3a3a3c" : "#e5e5ea";
  const subtitleColor = isDark ? "#8e8e93" : "#6c6c70";

  const logout = async () => {
    router.replace("/");
    await authClient.signOut();
  };

  return (
    <View style={styles.container} backgroundColor={bg}>
      <YStack width="100%" maxWidth={400} alignItems="center" gap="$1" marginBottom="$6">
        <Text fontSize="$5" fontWeight="bold" color={isDark ? "white" : "black"}>
          {session?.user.name}
        </Text>
        <Text fontSize="$3" color={subtitleColor}>
          {session?.user.email}
        </Text>
      </YStack>

      <YStack width="100%" maxWidth={400} gap="$5">
        <Section title="Appearance" isDark={isDark} borderColor={borderColor} cardBg={cardBg}>
          <SettingsRow
            icon="moon"
            label="Dark mode"
            isDark={isDark}
            right={
              <Switch
                value={isDark}
                onValueChange={(val) => setTheme(val ? "dark" : "light")}
                trackColor={{ false: "#e5e5ea", true: "#e53e3e" }}
                thumbColor="#ffffff"
              />
            }
          />
        </Section>

        <Section title="Account" isDark={isDark} borderColor={borderColor} cardBg={cardBg}>
          <SettingsRow
            icon="person-outline"
            label={session?.user.name ?? ""}
            isDark={isDark}
            right={<Text color={subtitleColor} fontSize="$3">{session?.user.email}</Text>}
          />
          <Divider color={borderColor} />
          <SettingsRow
            icon="log-out-outline"
            label="Sign out"
            isDark={isDark}
            onPress={logout}
            destructive
          />
        </Section>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 20,
  },
});
