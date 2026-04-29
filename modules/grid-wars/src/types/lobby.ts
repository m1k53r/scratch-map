type Lobby = {
  id: string;
  hostId: string;
  lobbyStatus: "waiting" | "active" | "game_started";
  isPublic: boolean;
  joinCode: string;
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  settings: object;
  createdAt: Date;
};

export default Lobby;
