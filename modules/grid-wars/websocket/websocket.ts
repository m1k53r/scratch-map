import { useLobby } from "@/stores/useLobby";

let ws: WebSocket | null = null;

export function connectWebsocket() {
  if (ws) return;

  ws = new WebSocket(process.env.EXPO_PUBLIC_BACKEND_WS_URL!);

  ws.onopen = () => {
    console.log("ws connected");
  };

  ws.onclose = () => {
    console.log("ws disconnected");
    ws = null;
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "lobbies_sync":
        useLobby.getState().setLobbies(data.payload);
        break;

      case "lobby_created":
        useLobby.getState().addLobby(data.payload);
        break;

      case "lobby_deleted":
        useLobby.getState().removeLobby(data.payload.id);
        break;
    }
  };
}
