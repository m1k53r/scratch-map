import { useLobby } from "@/stores/useLobby";

export function useCurrentLobby() {
  return useLobby(
    (state) => state.lobbies.find((l) => l.id === state.currentLobby) ?? null,
  );
}
