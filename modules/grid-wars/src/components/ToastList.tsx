import { client } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useLobby } from "@/stores/useLobby";
import { FormMode } from "@/types/formMode";
import { Toast, useToasts } from "@tamagui/toast/v2";
import { Button, useTheme, View } from "tamagui";

interface ToastListProps {
  setFormMode: (mode: FormMode) => void;
}

export default function ToastList({ setFormMode }: ToastListProps) {
  const { toasts } = useToasts();
  const { theme } = useTheme();
  const { data } = authClient.useSession();
  const addMembers = useLobby((state) => state.addMembers);

  let joinLobby = async (lobbyId: string) => {
    if (!data) return;

    const res = await client["join-lobby"].post({
      lobbyId: lobbyId,
    });
    setFormMode("waiting_for_players");
    addMembers([data.user.id]);
    console.log(lobbyId);
    console.log(res);
  };

  return (
    <View margin={16}>
      {toasts.map((t, index) => (
        <Toast.Item
          key={t.id}
          toast={t}
          index={index}
          animation="bouncy"
          enterStyle={{
            opacity: 0,
            y: -25,
            scale: 0.9,
          }}
          exitStyle={{
            opacity: 0,
            y: -20,
            scale: 0.95,
          }}
          opacity={1}
          y={0}
          scale={1}
          borderRadius="$6"
          padding="$4"
          borderWidth={1}
          elevation="$6"
          theme={theme}
        >
          <Toast.Title fontWeight="700">{t.title}</Toast.Title>

          {t.description && (
            <Toast.Description>{t.description}</Toast.Description>
          )}
          <View flexDirection="row" gap="$2" width="100%">
            <Button
              backgroundColor="green"
              flex={1}
              onPress={() => {
                const description =
                  typeof t.description === "string" ? t.description : "";
                joinLobby(description);
              }}
            >
              Join
            </Button>
            <Button backgroundColor="red" flex={1}>
              Skip
            </Button>
          </View>
        </Toast.Item>
      ))}
    </View>
  );
}
