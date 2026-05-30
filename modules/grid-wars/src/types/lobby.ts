import { gameState } from "@gridwars/types";

type Lobby = {
  id: string;
  hostId: string;
  lobbyStatus: gameState;
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
