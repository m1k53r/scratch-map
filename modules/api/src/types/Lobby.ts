import Settings from "./Settings";
export type Lobby = {
  id: string;
  hostId: string;
  lobbyStatus: "waiting" | "active" | "game_started";
  joinCode: string | null;
  coordinates: [number, number][];
  settings: Settings;
  members: string[];
  createdAt: Date;
};

interface Lobbies {
  [gameCode: string]: Lobby;
}

export default Lobbies;
