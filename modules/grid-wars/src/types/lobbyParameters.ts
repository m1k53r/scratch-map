import { Feature, Polygon } from "geojson";

export interface LobbyParameters {
  timeLimit: number;
  membersLimit: number;
  points: [number, number][];
  lobbyArea: Feature<Polygon> | null;
}
