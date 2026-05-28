export type { App } from "../../modules/api/src/types";
export enum WebSocketCodes {
  OPENED_CONNECTION,
  CLOSED_CONNECTION,
  PLAYER_JOINED,
  PLAYER_LEFT,
  LOBBY_CREATED,
  LOBBY_CLOSED,
  LOBBIES_SYNC,
  START_GAME,
  END_GAME,
  COLLECT_FLAG,
}

export enum WebSocketResponses {
  GAME_STARTED,
}

export interface MessageBody { }

export interface MessageResponse { }

export interface LobbiesSyncBody extends MessageBody {
  id: string;
  coordinates: [number, number][];
  hostId: string;
}

export interface PlayerJoinedBody extends MessageBody {
  lobbyId: string;
  playerId: string;
}

export interface GameStateChangeBody extends MessageBody {
  lobbyId: string;
}

export interface CollectFlagBody extends MessageBody {
  lobbyId: string;
  playerId: string;
  flagCoordinates: [number, number]
}

export interface MessageType<T extends MessageBody> {
  code: WebSocketCodes;
  body: T;
}


export interface GameStateChangeResponse extends MessageResponse {
  flags: number[][];
}

export interface MessageTypeResponse<T extends MessageResponse> {
  code: WebSocketResponses;
  body: T;
}
