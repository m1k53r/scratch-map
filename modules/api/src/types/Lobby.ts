import Settings from "./Settings";
export type Lobby = {
  id: string;
  lobbyStatus: "waiting" | "active" | "game_started";
  joinCode: string | null;
  coordinates: [number, number][];
  settings: Settings;
  // first member is always the host
  members: string[];
  createdAt: Date;
  flags: number[][];
};

interface Lobbies {
  [gameCode: string]: Lobby;
}

export default Lobbies;
