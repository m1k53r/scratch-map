import { client } from "./api-client";
import {
  GameStateChangeResponse,
  MessageResponse,
  MessageTypeResponse,
  NewFlagResponse,
  PlayerTransitionResponse,
  WebSocketResponses,
} from "@gridwars/types";
import { useLobby, LobbyOnMap } from "@/stores/useLobby";
import { useEffect, useRef } from "react";

export function useWebSocket() {
  const ref = useRef<ReturnType<typeof client.ws.subscribe>>(null);
  const {
    addLobby,
    removeLobby,
    setLobbies,
    updateLobbyState,
    setFlags,
    addMembers,
    removeMember,
  } = useLobby.getState();
  useEffect(() => {
    const wsClient = client.ws.subscribe();
    ref.current = wsClient;

    console.log("Connection initialized");

    wsClient.subscribe((event) => {
      const message = event.data as MessageTypeResponse<MessageResponse>;
      switch (message.code) {
        case WebSocketResponses.PLAYER_JOINED:
          const playerJoined =
            message as MessageTypeResponse<PlayerTransitionResponse>;
          addMembers([playerJoined.body.playerId]);
          break;
        case WebSocketResponses.PLAYER_LEFT:
          const playerLeft =
            message as MessageTypeResponse<PlayerTransitionResponse>;
          removeMember(playerLeft.body.playerId);
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
          const gameStarted =
            message as MessageTypeResponse<GameStateChangeResponse>;
          updateLobbyState("playing");
          setFlags(gameStarted.body.flags);
          break;
        case WebSocketResponses.GAME_ENDED:
          updateLobbyState("finished");
          break;
        case WebSocketResponses.NEW_FLAG:
          const newFlags = message as MessageTypeResponse<NewFlagResponse>;
          setFlags(newFlags.body.flags);
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

  return { ref };
}
