import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import cors from "@elysiajs/cors";
import { createLobby } from "./lobby";
import Lobbies, { Lobby } from "./types/Lobby";
import { MessageType, WebSocketCodes } from "@gridwars/types";

let lobbies: Lobbies = {};
const wsClients = new Set<any>();

function broadcast(data: unknown) {
  const message = JSON.stringify(data);

  for (const client of wsClients) {
    client.send(message);
  }
}

export const websocket = new Elysia({ name: "websocket" })
  .use(cors())
  .ws("/ws", {
    open(ws) {
      wsClients.add(ws);
      const message: MessageType = {
        code: WebSocketCodes.LOBBIES_SYNC,
        body: Object.values(lobbies),
      };
      ws.send(JSON.stringify(message));
    },
    close(ws) {
      wsClients.delete(ws);
    },
  })
  .listen(3080);

const betterAuth = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

export const app = new Elysia()
  .use(openapi({ path: "/" }))
  .use(betterAuth)
  .use(cors())
  .use(websocket)
  .get("/me", ({ user }) => user, {
    auth: true,
  })
  .post(
    "create-lobby",
    ({ body }) => {
      const alreadyHasLobby = Object.values(lobbies).some(
        (lobby) => lobby.hostId == body.hostId,
      );
      if (alreadyHasLobby) return;

      const newLobby: Lobby = createLobby(
        body.hostId,
        body.isPublic,
        body.coordinates,
        body.membersLimit,
        body.timeLimit,
      );
      lobbies[newLobby.id] = newLobby;
      const message: MessageType = {
        code: WebSocketCodes.LOBBY_CREATED,
        body: {
          id: newLobby.id,
          coordinates: newLobby.coordinates,
        },
      };
      broadcast(message);
      console.log(lobbies);
      return newLobby.id;
    },
    {
      body: t.Object({
        hostId: t.String(),
        isPublic: t.Boolean(),
        coordinates: t.Array(t.Tuple([t.Number(), t.Number()])),
        membersLimit: t.Number(),
        timeLimit: t.Number(),
      }),
    },
  )
  .get("get-lobbies", () => {
    return lobbies;
  })
  .post(
    "delete-lobby",
    ({ body }) => {
      const { lobbyId } = body;
      if (!(lobbyId in lobbies)) {
        return { success: false };
      }

      delete lobbies[lobbyId];
      const message: MessageType = {
        code: WebSocketCodes.LOBBY_CLOSED,
        body: lobbyId,
      };
      broadcast(message);

      return {
        success: true,
        removedId: lobbyId,
      };
    },
    {
      body: t.Object({ lobbyId: t.String() }),
    },
  )
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

console.log(
  `🦊 WebSocket server is running at ${websocket.server?.hostname}:${websocket.server?.port}`,
);

export type App = typeof app;
