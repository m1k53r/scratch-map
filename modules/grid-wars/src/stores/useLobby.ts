import { create } from "zustand";

export type LobbyOnMap = {
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
    set((state) => {
      const exists = state.lobbies.some((l) => l.id === lobby.id);

      if (exists) {
        return state;
      }

      return {
        lobbies: [...state.lobbies, lobby],
      };
    }),

  removeLobby: (lobbyId) => {
    set((state) => {
      const exists = state.lobbies.some((l) => l.id === lobbyId);

      if (!exists) {
        return state;
      }

      return {
        lobbies: state.lobbies.filter((l) => l.id !== lobbyId),
      };
    });
  },
  setLobbies: (lobbies) => set({ lobbies }),
}));
