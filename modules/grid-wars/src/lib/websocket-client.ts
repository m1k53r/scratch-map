import { client } from "./api-client";
import {
  GameEndResponse,
  GameStateChangeResponse,
  LobbiesSyncResponse,
  MessageResponse,
  MessageTypeResponse,
  NewFlagResponse,
  PlayerTransitionResponse,
  WebSocketResponses,
} from "@gridwars/types";
import { useLobby } from "@/stores/useLobby";
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
    addPoints,
    setWinner,
    setPlayerName,
    setGameEndsAt,
  } = useLobby.getState();
  useEffect(() => {
    const wsClient = client.ws.subscribe();
    ref.current = wsClient;

    console.log("Connection initialized");

    wsClient.subscribe((event) => {
      const message = event.data as MessageTypeResponse<MessageResponse>;
      switch (message.code) {
        case WebSocketResponses.PLAYER_JOINED:
          console.log("player joined");
          const playerJoined =
            message as MessageTypeResponse<PlayerTransitionResponse>;
          addMembers([playerJoined.body.playerId]);
          setPlayerName(playerJoined.body.playerId, playerJoined.body.playerName);
          break;
        case WebSocketResponses.PLAYER_LEFT:
          const playerLeft =
            message as MessageTypeResponse<PlayerTransitionResponse>;
          removeMember(playerLeft.body.playerId);
          break;
        case WebSocketResponses.LOBBY_CREATED:
          const created = message.body as LobbiesSyncResponse;
          addLobby({ ...created, flags: [], points: {} });
          break;
        case WebSocketResponses.LOBBY_CLOSED:
          removeLobby(message.body as string);
          break;
        case WebSocketResponses.LOBBIES_SYNC:
          const synced = message.body as LobbiesSyncResponse[];
          setLobbies(synced.map((l) => ({ ...l, flags: [], points: {} })));
          break;
        case WebSocketResponses.GAME_STARTED:
          console.log("game started.");
          const gameStarted =
            message as MessageTypeResponse<GameStateChangeResponse>;
          updateLobbyState("playing");
          setFlags(gameStarted.body.flags);
          setGameEndsAt(Date.now() + gameStarted.body.timeLimit * 60 * 1000);
          break;
        case WebSocketResponses.GAME_ENDED:
          const gameEnded = message as MessageTypeResponse<GameEndResponse>;
          updateLobbyState("finished");
          setWinner(gameEnded.body.playerId);
          setGameEndsAt(null);
          break;
        case WebSocketResponses.NEW_FLAG:
          console.log("new flag.");
          const newFlags = message as MessageTypeResponse<NewFlagResponse>;
          console.log(newFlags.body.flags);
          setFlags(newFlags.body.flags);
          addPoints(newFlags.body.playerId);
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
