export type { App } from "../../modules/api/src/types";
export enum WebSocketCodes {
  OPENED_CONNECTION,
  CLOSED_CONNECTION,
  PLAYER_JOINED,
  PLAYER_LEFT,
  LOBBY_CREATED,
  LOBBY_CLOSED,
  LOBBIES_SYNC,
}

export interface MessageType {
  code: WebSocketCodes;
  body: unknown;
}
