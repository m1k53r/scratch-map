export type { App } from "../../modules/api/src/types";
export enum WebSocketCodes {
  PLAYER_JOINED,
  PLAYER_LEFT,
}

export interface MessageType {
  code: WebSocketCodes;
  body: unknown;
}
