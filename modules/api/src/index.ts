import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import cors from "@elysiajs/cors";
import { createLobby } from "./lobby";
import Lobbies, { Lobby } from "./types/Lobby";
import {
  CollectFlagBody,
  GameEndResponse,
  GameStateChangeBody,
  GameStateChangeResponse,
  LobbiesSyncResponse,
  MessageBody,
  MessageType,
  MessageTypeResponse,
  NewFlagResponse,
  PlayerJoinedBody as PlayerTransitionBody,
  PlayerTransitionResponse,
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

export const websocket = new Elysia({ name: "websocket" })
  .use(cors())
  .use(betterAuth)
  .ws("/ws", {
    auth: true,
    open(ws) {
      // why is this not a regular endpoint?
      wsClients.add(ws);
      const message: MessageTypeResponse<Array<LobbiesSyncResponse>> = {
        code: WebSocketResponses.LOBBIES_SYNC,
        body: Object.values(lobbies).map((lobby) => {
          return {
            id: lobby.id,
            coordinates: lobby.coordinates,
            members: lobby.members,
            state: lobby.lobbyStatus,
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

          const playerJoinedResponse: MessageTypeResponse<PlayerTransitionResponse> =
            {
              code: WebSocketResponses.PLAYER_JOINED,
              body: {
                playerId: ws.data.user.id,
              },
            };
          ws.publish(playerJoined.lobbyId, playerJoinedResponse);
          break;

        case WebSocketCodes.PLAYER_LEFT:
          const playerLeft = message.body as PlayerTransitionBody;
          ws.unsubscribe(playerLeft.lobbyId);

          const playerLeftResponse: MessageTypeResponse<PlayerTransitionResponse> =
            {
              code: WebSocketResponses.PLAYER_LEFT,
              body: {
                playerId: ws.data.user.id,
              },
            };
          ws.publish(playerLeft.lobbyId, playerLeftResponse);

          // check if that was the last player in the lobby
          if (lobbies[playerLeft.lobbyId].members.length === 0) {
            delete lobbies[playerLeft.lobbyId];
          }
          break;

        case WebSocketCodes.START_GAME:
          const startGame = message.body as GameStateChangeBody;
          const lobby = lobbies[startGame.lobbyId];
          lobby.lobbyStatus = "playing";

          const inside = generateRandomPoints(lobby.coordinates);
          lobby.flags = [
            inside.features[0].geometry.coordinates as number[],
            inside.features[1].geometry.coordinates as number[],
          ];

          // Send message when game ends
          setTimeout(
            () => {
              let endResponse: MessageTypeResponse<GameEndResponse> = {
                code: WebSocketResponses.GAME_ENDED,
                body: {
                  lobbyId: lobby.id,
                },
              };
              ws.publish(startGame.lobbyId, endResponse);
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
          ws.send(startResponse); // send back to host too
          break;

        case WebSocketCodes.END_GAME:
          // not needed?
          break;

        case WebSocketCodes.COLLECT_FLAG:
          const collectFlag = message.body as CollectFlagBody;
          const flagLobby = lobbies[collectFlag.lobbyId];
          const newFlag = generateRandomPoints(flagLobby.coordinates)
            .features[0].geometry.coordinates;
          if (flagLobby.flags[0] === collectFlag.flagCoordinates) {
            flagLobby.flags[0] = newFlag as number[];
          } else if (flagLobby.flags[1] === collectFlag.flagCoordinates) {
            flagLobby.flags[1] = newFlag as number[];
          }

          const newFlagResponse: MessageTypeResponse<NewFlagResponse> = {
            code: WebSocketResponses.NEW_FLAG,
            body: {
              flags: flagLobby.flags,
            },
          };
          ws.publish(collectFlag.lobbyId, newFlagResponse);
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
    ({ user, body }) => {
      const alreadyHasLobby = Object.values(lobbies).some((lobby) =>
        lobby.members.includes(user.id),
      );
      if (alreadyHasLobby) return { id: "", success: false };

      console.log(user.id);
      const newLobby: Lobby = createLobby(
        user.id,
        body.isPublic,
        body.coordinates,
        body.membersLimit,
        body.timeLimit,
      );
      lobbies[newLobby.id] = newLobby;
      const message: MessageTypeResponse<LobbiesSyncResponse> = {
        code: WebSocketResponses.LOBBY_CREATED,
        body: {
          id: newLobby.id,
          coordinates: newLobby.coordinates,
          members: newLobby.members,
          state: newLobby.lobbyStatus,
        },
      };
      broadcast(message);
      console.log(lobbies);
      return { id: newLobby.id, success: true };
    },
    {
      body: t.Object({
        isPublic: t.Boolean(),
        coordinates: t.Array(t.Tuple([t.Number(), t.Number()])),
        membersLimit: t.Number(),
        timeLimit: t.Number(),
      }),
      response: t.Object({
        id: t.String(),
        success: t.Boolean(),
      }),
      auth: true,
    },
  )
  .post(
    "join-lobby",
    ({ user, body }) => {
      if (body.lobbyId === "") return { success: false };
      const lobbyToJoin = Object.values(lobbies).some((lobby) =>
        lobby.id.includes(body.lobbyId),
      );
      if (lobbyToJoin) {
        const isUserAlreadyInLobby = Object.values(lobbies).some((lobby) =>
          lobby.members.includes(user.id),
        );
        if (isUserAlreadyInLobby) return { success: false };
        lobbies[body.lobbyId].members.push(user.id);
        console.log(lobbies[body.lobbyId].members);
      }
    },
    {
      body: t.Object({
        lobbyId: t.String(),
      }),
      auth: true,
    },
  )
  .get(
    "get-lobbies",
    () => {
      return lobbies;
    },
    { auth: true },
  )
  .post(
    "delete-lobby",
    ({ body }) => {
      const { lobbyId } = body;
      if (!(lobbyId in lobbies)) {
        return { success: false };
      }

      delete lobbies[lobbyId];
      const message: MessageTypeResponse<string> = {
        code: WebSocketResponses.LOBBY_CLOSED,
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
      auth: true,
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
      auth: true,
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
      auth: true,
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
