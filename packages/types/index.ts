export type { App } from "../../modules/api/src/types";
export enum WebSocketCodes {
  OPENED_CONNECTION,
  CLOSED_CONNECTION,
  PLAYER_JOINED,
  PLAYER_LEFT,
  START_GAME,
  END_GAME,
  COLLECT_FLAG,
}

export enum WebSocketResponses {
  GAME_STARTED,
  GAME_ENDED,
  NEW_FLAG,
  PLAYER_JOINED,
  PLAYER_LEFT,
  LOBBY_CREATED,
  LOBBY_CLOSED,
  LOBBIES_SYNC,
}

export interface MessageBody { }

export interface MessageResponse { }

export interface PlayerJoinedBody extends MessageBody {
  lobbyId: string;
}

export interface GameStateChangeBody extends MessageBody {
  lobbyId: string;
}

export interface CollectFlagBody extends MessageBody {
  lobbyId: string;
  flagCoordinates: [number, number]
}

export interface MessageType<T extends MessageBody> {
  code: WebSocketCodes;
  body: T;
}


export interface GameStateChangeResponse extends MessageResponse {
  flags: number[][];
}

export interface GameEndResponse extends MessageResponse {
  lobbyId: string;
}

export interface NewFlagResponse extends MessageResponse {
  flags: number[][];
}

export interface PlayerTransitionResponse extends MessageResponse {
  playerId: string;
}

export interface LobbiesSyncResponse extends MessageBody {
  id: string;
  coordinates: [number, number][];
  members: string[];
  state: gameState;
}

export interface MessageTypeResponse<T extends MessageResponse> {
  code: WebSocketResponses;
  body: T;
}

export type gameState = "waiting" | "playing" | "finished"
