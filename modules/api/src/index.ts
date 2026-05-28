import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import cors from "@elysiajs/cors";
import { createLobby } from "./lobby";
import Lobbies, { Lobby } from "./types/Lobby";
import { randomPoint } from "@turf/random";
import { pointsWithinPolygon } from "@turf/points-within-polygon";
import { bbox } from "@turf/bbox";
import { lineString, polygon } from "@turf/helpers";
import type { Position } from "geojson";
import {
  CollectFlagBody,
  GameStateChangeBody,
  GameStateChangeResponse,
  LobbiesSyncBody,
  MessageBody,
  MessageType,
  MessageTypeResponse,
  PlayerJoinedBody as PlayerTransitionBody,
  WebSocketCodes,
  WebSocketResponses,
} from "@gridwars/types";
import { generateRandomPoints } from "./utils";

let lobbies: Lobbies = {};
const testLobby: Lobby = {
  id: "ec707f78-fa40-4eea-bfe8-7520a93daa8a",
  lobbyStatus: "waiting",
  joinCode: "XFK4LV",
  coordinates: [
    [18.644138233573585, 54.354860406740386],
    [18.64666623459479, 54.35491514271857],
    [18.646572623977477, 54.35333726188969],
    [18.644138233573585, 54.354860406740386],
  ],
  members: ["GBT37DSgsuxBui59xZsGc0gimeuZvZls"],
  settings: {
    membersLimit: 10,
    timeLimit: 10,
  },
  createdAt: new Date(Date.now()),
  flags: [],
};
lobbies[testLobby.id] = testLobby;

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
      const message: MessageType<Array<LobbiesSyncBody>> = {
        code: WebSocketCodes.LOBBIES_SYNC,
        body: Object.values(lobbies).map((lobby) => {
          return {
            id: lobby.id,
            coordinates: lobby.coordinates,
            hostId: lobby.members[0],
          };
        }),
      };
      ws.send(JSON.stringify(message));
    },
    message(ws, message: MessageType<MessageBody>) {
      switch (message.code) {
        case WebSocketCodes.PLAYER_JOINED:
          const playerJoined = message.body as PlayerTransitionBody;
          ws.subscribe(playerJoined.lobbyId);
          ws.publish(playerJoined.lobbyId, "Player joined blah blah");
          break;
        case WebSocketCodes.PLAYER_LEFT:
          const playerLeft = message.body as PlayerTransitionBody;
          ws.unsubscribe(playerLeft.lobbyId);
          ws.publish(playerLeft.lobbyId, "Player left blah blah");
          break;
        case WebSocketCodes.START_GAME:
          const startGame = message.body as GameStateChangeBody;
          const lobby = lobbies[startGame.lobbyId];
          lobby.lobbyStatus = "game_started";

          const inside = generateRandomPoints(lobby.coordinates);
          lobby.flags = [
            inside.features[0].geometry.coordinates as number[],
            inside.features[1].geometry.coordinates as number[],
          ];

          // Send message when game ends
          setTimeout(
            () => {
              ws.publish(startGame.lobbyId, "Game ended blah blah");
              delete lobbies[startGame.lobbyId];
            },
            lobby.settings.timeLimit * 1000 * 60,
          );

          let startResponse: MessageTypeResponse<GameStateChangeResponse> = {
            code: WebSocketResponses.GAME_STARTED,
            body: {
              flags: lobby.flags,
            },
          };
          ws.publish(startGame.lobbyId, startResponse);
          break;
        case WebSocketCodes.END_GAME:
          // not needed?
          break;
        case WebSocketCodes.COLLECT_FLAG:
          const collectFlag = message.body as CollectFlagBody;
          const flagLobby = lobbies[collectFlag.lobbyId];
          ws.publish(
            collectFlag.lobbyId,
            "Flag collected, here's new flag blah blah",
          );
          break;
        default:
          console.error("Unknown message type");
      }
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
  .use(cors())
  .use(openapi({ path: "/docs" }))
  .use(betterAuth)
  .use(websocket)
  .get("/me", ({ user }) => user, {
    auth: true,
  })
  .post(
    "create-lobby",
    ({ body }) => {
      const alreadyHasLobby = Object.values(lobbies).some((lobby) =>
        lobby.members.includes(body.hostId),
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
          hostId: newLobby.members[0],
        },
      };
      broadcast(message);
      console.log(lobbies);
      return { id: newLobby.id, success: true };
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
  .post(
    "join-lobby",
    ({ body }) => {
      if (body.lobbyId === "" || body.joinerId === "")
        return { success: false };
      const lobbyToJoin = Object.values(lobbies).some((lobby) =>
        lobby.id.includes(body.lobbyId),
      );
      if (lobbyToJoin) {
        const isUserAlreadyInLobby = Object.values(lobbies).some((lobby) =>
          lobby.members.includes(body.joinerId),
        );
        if (isUserAlreadyInLobby) return { success: false };
        lobbies[body.lobbyId].members.push(body.joinerId);
        console.log(lobbies[body.lobbyId].members);
      }
    },
    {
      body: t.Object({
        lobbyId: t.String(),
        joinerId: t.String(),
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
  .post(
    "get-lobby-members",
    ({ body }) => {
      const lobbyId = body.lobbyId;
      const lobby = lobbies[lobbyId];
      if (!lobby) {
        return { success: false };
      }
      return { success: true, members: lobby.members };
    },
    {
      body: t.Object({ lobbyId: t.String() }),
    },
  )
  .post(
    "start-game",
    ({ body }) => {
      const lobby = lobbies[body.lobbyId];
      lobby.lobbyStatus = "game_started";
      setTimeout(
        () => {
          console.log("game ended");
        },
        lobby.settings.timeLimit * 1000 * 60,
      );
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
