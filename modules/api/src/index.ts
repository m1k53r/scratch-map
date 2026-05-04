import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import cors from "@elysiajs/cors";
import { createLobby } from "./lobby";
import Lobbies, { Lobby } from "./types/Lobby";

let lobbies: Lobbies = {};

export const websocket = new Elysia({ name: "websocket" })
  .use(cors())
  .ws("/ws", {
    open(ws) {
      console.log("WebSocket connection opened");
    },
    message(ws, message) {
      console.log("Received message:", message);
      ws.send(`Echo: ${message}`);
    },
    close(ws) {
      console.log("WebSocket connection closed");
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
      const newLobby: Lobby = createLobby(body.hostId, body.isPublic, [
        body.minLat,
        body.minLng,
      ]);
      lobbies[newLobby.id] = newLobby;
      console.log(lobbies);
      return { message: "Lobby created successfully" };
    },
    {
      body: t.Object({
        hostId: t.String(),
        isPublic: t.Boolean(),
        minLat: t.Number(),
        minLng: t.Number(),
      }),
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
