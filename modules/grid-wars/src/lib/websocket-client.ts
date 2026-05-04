import { client } from "./api-client";
import { MessageType, WebSocketCodes } from "@gridwars/types";

export const wsClient = client.ws.subscribe();

wsClient.subscribe((event) => {
  const message = event.data as MessageType;
  switch (message.code) {
    case WebSocketCodes.PLAYER_JOINED:
      console.log("sth");
      break;
    case WebSocketCodes.PLAYER_LEFT:
      console.log("sth");
      break;
    default:
      console.log("bomba");
  }
});
