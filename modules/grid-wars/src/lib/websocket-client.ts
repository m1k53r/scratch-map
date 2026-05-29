import { client } from "./api-client";
import {
  GameStateChangeResponse,
  MessageResponse,
  MessageTypeResponse,
  WebSocketResponses,
} from "@gridwars/types";
import { useLobby, LobbyOnMap } from "@/stores/useLobby";
import { useEffect } from "react";

export function useWebSocket() {
  const addLobby = useLobby((state) => state.addLobby);
  const removeLobby = useLobby((state) => state.removeLobby);
  const setLobbies = useLobby((state) => state.setLobbies);
  const updateLobby = useLobby((state) => state.updateLobbyState);

  useEffect(() => {
    const wsClient = client.ws.subscribe();

    console.log("Connection initialized");

    wsClient.subscribe((event) => {
      const message = event.data as MessageTypeResponse<MessageResponse>;
      switch (message.code) {
        case WebSocketResponses.PLAYER_JOINED:
          console.log("sth");
          break;
        case WebSocketResponses.PLAYER_LEFT:
          console.log("sth");
          break;
        case WebSocketResponses.LOBBY_CREATED:
          addLobby(message.body as LobbyOnMap);
          break;
        case WebSocketResponses.LOBBY_CLOSED:
          removeLobby(message.body as string);
          break;
        case WebSocketResponses.LOBBIES_SYNC:
          setLobbies(message.body as LobbyOnMap[]);
          break;
        case WebSocketResponses.GAME_STARTED:
          updateLobby("playing");
          break;
        case WebSocketResponses.GAME_ENDED:
          updateLobby("finished");
          break;
        case WebSocketResponses.NEW_FLAG:
          break;
        default:
          console.log("bomba");
          break;
      }
    });

    return () => {
      console.log("Connection dropped");
      wsClient.close();
    };
  }, []);
}
