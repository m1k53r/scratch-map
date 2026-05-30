import { gameState } from "@gridwars/types";
import { create } from "zustand";

export type LobbyOnMap = {
  id: string;
  coordinates: [number, number][];
  members: string[];
  state: gameState;
  flags: number[][];
};

interface State {
  lobbies: LobbyOnMap[];
  currentLobby: string | null;
}

interface Action {
  addLobby: (lobby: LobbyOnMap) => void;
  removeLobby: (id: string) => void;
  setLobbies: (lobbies: LobbyOnMap[]) => void;
  updateLobbyState: (gameState: gameState) => void;
  setFlags: (flags: number[][]) => void;
  setCurrentLobby: (id: string | null) => void;
  addMembers: (member: string[]) => void;
  removeMember: (member: string) => void;
}

export const useLobby = create<State & Action>((set) => ({
  lobbies: [],
  currentLobby: null,

  addLobby: (lobby: LobbyOnMap) =>
    set((state) => {
      const exists = state.lobbies.some((l) => l.id === lobby.id);

      if (exists) {
        return state;
      }

      return {
        lobbies: [...state.lobbies, lobby],
      };
    }),

  removeLobby: (lobbyId: string) => {
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
  setLobbies: (lobbies: LobbyOnMap[]) => set({ lobbies }),
  updateLobbyState: (gameState: gameState) => {
    set((state) => ({
      lobbies: state.lobbies.map((lobby) =>
        lobby.id === state.currentLobby
          ? { ...lobby, state: gameState }
          : lobby,
      ),
    }));
  },
  addMembers: (members: string[]) => {
    set((state) => ({
      lobbies: state.lobbies.map((lobby) =>
        lobby.id === state.currentLobby
          ? { ...lobby, members: [...lobby.members, ...members] }
          : { ...lobby },
      ),
    }));
  },
  removeMember: (member: string) => {
    set((state) => ({
      lobbies: state.lobbies.map((lobby) =>
        lobby.id === state.currentLobby
          ? { ...lobby, members: lobby.members.filter((m) => m === member) }
          : { ...lobby },
      ),
    }));
  },
  setCurrentLobby: (id: string | null) => {
    set(() => ({
      currentLobby: id,
    }));
  },
  setFlags: (flags: number[][]) => {
    set((state) => ({
      lobbies: state.lobbies.map((lobby) =>
        lobby.id === state.currentLobby ? { ...lobby, flags } : { ...lobby },
      ),
    }));
  },
}));
