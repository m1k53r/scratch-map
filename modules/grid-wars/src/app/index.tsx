import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Button } from "react-native";

export default function Index() {
  const router = useRouter();

  const handleLogin = async () => {
    console.log("dupa");
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });

    console.log(error);

    if (error) {
      console.log("oops");
      return;
    }

    console.log("yeah");
    router.replace({ pathname: "/dashboard" });
  };

  return (
    <>
      <Button
        title="Test network"
        onPress={async () => {
          console.log("pizda");
          const result = await fetch("http://172.22.234.113:8080/health");
          console.log(result);
        }}
      />
      ;
      <Button title="Login with Github" onPress={handleLogin} />;
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
