import { Feature, Polygon } from "geojson";

export interface LobbyParameters {
  timeLimit: string;
  membersLimit: string;
  points: [number, number][];
  lobbyArea: Feature<Polygon> | null;
}
