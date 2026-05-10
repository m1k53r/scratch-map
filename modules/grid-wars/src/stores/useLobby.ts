import { create } from "zustand";

type LobbyOnMap = {
  id: string;
  coordinates: [number, number][];
};

type LobbyStore = {
  lobbies: LobbyOnMap[];
  addLobby: (lobby: LobbyOnMap) => void;
  removeLobby: (id: string) => void;
  setLobbies: (lobbies: LobbyOnMap[]) => void;
};

export const useLobby = create<LobbyStore>((set) => ({
  lobbies: [],
  addLobby: (lobby) =>
    set((state) => ({
      lobbies: [...state.lobbies, lobby],
    })),
}));
