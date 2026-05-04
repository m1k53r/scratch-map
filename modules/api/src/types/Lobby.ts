export type Lobby = {
  id: string;
  hostId: string;
  lobbyStatus: "waiting" | "active" | "game_started";
  joinCode: string | null;
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  settings: object;
  members: string[];
  createdAt: Date;
};

interface Lobbies {
  [gameCode: string]: Lobby;
}

export default Lobbies;
