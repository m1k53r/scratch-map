import { client } from "./api-client";
import { MessageType, WebSocketCodes } from "@gridwars/types";
import { useLobby, LobbyOnMap } from "@/stores/useLobby";

let initialized = false;

export function initWebSocket() {
  if (initialized) return;

  initialized = true;

  const wsClient = client.ws.subscribe();

  console.log("Connection initialized");

  wsClient.subscribe((event) => {
    const message = event.data as MessageType;
    switch (message.code) {
      case WebSocketCodes.PLAYER_JOINED:
        console.log("sth");
        break;
      case WebSocketCodes.PLAYER_LEFT:
        console.log("sth");
        break;
      case WebSocketCodes.LOBBY_CREATED:
        useLobby.getState().addLobby(message.body as LobbyOnMap);
        break;
      case WebSocketCodes.LOBBY_CLOSED:
        useLobby.getState().removeLobby(message.body as string);
        break;
      case WebSocketCodes.LOBBIES_SYNC:
        useLobby.getState().setLobbies(message.body as LobbyOnMap[]);
        break;
      case WebSocketCodes.OPENED_CONNECTION:
        break;
      case WebSocketCodes.CLOSED_CONNECTION:
        break;
      default:
        console.log("bomba");
    }
  });
}
