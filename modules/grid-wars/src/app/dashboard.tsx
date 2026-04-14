import { Text } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function Index() {
  const { data: session } = authClient.useSession();

  return <Text>Welcome, {session?.user.name}</Text>;
}
