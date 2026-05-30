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
  playerNames: {},
  settings: {
    membersLimit: 10,
    timeLimit: 10,
  },
  createdAt: new Date(Date.now()),
  flags: [],
  points: {},
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
    open(ws) {
      console.log("opened connection");
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
      console.log("new message");
      switch (message.code) {
        case WebSocketCodes.PLAYER_JOINED:
          const playerJoined = message.body as PlayerTransitionBody;
          const joiningLobby = lobbies[playerJoined.lobbyId];

          if (joiningLobby) {
            joiningLobby.playerNames[playerJoined.playerId] = playerJoined.playerName;

            // Send each existing member's name back to the new joiner
            for (const [id, name] of Object.entries(joiningLobby.playerNames)) {
              if (id !== playerJoined.playerId) {
                const existingMember: MessageTypeResponse<PlayerTransitionResponse> = {
                  code: WebSocketResponses.PLAYER_JOINED,
                  body: { playerId: id, playerName: name },
                };
                ws.send(JSON.stringify(existingMember));
              }
            }
          }

          ws.subscribe(playerJoined.lobbyId);

          const playerJoinedResponse: MessageTypeResponse<PlayerTransitionResponse> = {
            code: WebSocketResponses.PLAYER_JOINED,
            body: {
              playerId: playerJoined.playerId,
              playerName: playerJoined.playerName,
            },
          };
          ws.publish(playerJoined.lobbyId, playerJoinedResponse);
          break;

        case WebSocketCodes.PLAYER_LEFT:
          const playerLeft = message.body as PlayerTransitionBody;
          const leavingLobby = lobbies[playerLeft.lobbyId];
          if (leavingLobby) {
            leavingLobby.members = leavingLobby.members.filter(
              (id) => id !== playerLeft.playerId,
            );
            delete leavingLobby.points[playerLeft.playerId];

            const playerLeftResponse: MessageTypeResponse<PlayerTransitionResponse> =
              {
                code: WebSocketResponses.PLAYER_LEFT,
                body: {
                  playerId: playerLeft.playerId,
                  playerName: playerLeft.playerName,
                },
              };
            ws.publish(playerLeft.lobbyId, playerLeftResponse);
            ws.unsubscribe(playerLeft.lobbyId);

            if (leavingLobby.members.length === 0) {
              delete lobbies[playerLeft.lobbyId];
            }
          }
          break;

        case WebSocketCodes.START_GAME:
          console.log("Start game");
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
                  playerId: Object.entries(lobby.points).reduce((a, b) =>
                    a[1] > b[1] ? a : b,
                  )[0],
                },
              };
              console.log("time's up");
              ws.publish(startGame.lobbyId, endResponse);
              ws.send(endResponse);
              delete lobbies[startGame.lobbyId];
            },
            lobby.settings.timeLimit * 1000 * 60,
          );

          let startResponse: MessageTypeResponse<GameStateChangeResponse> = {
            code: WebSocketResponses.GAME_STARTED,
            body: {
              flags: lobby.flags,
              timeLimit: lobby.settings.timeLimit,
            },
          };
          ws.publish(startGame.lobbyId, startResponse);
          ws.send(startResponse); // send back to host too
          break;

        case WebSocketCodes.END_GAME:
          // not needed?
          break;

        case WebSocketCodes.COLLECT_FLAG:
          console.log("flag collected");
          const collectFlag = message.body as CollectFlagBody;
          const flagLobby = lobbies[collectFlag.lobbyId];
          const newFlag = generateRandomPoints(flagLobby.coordinates)
            .features[0].geometry.coordinates;
          console.log(newFlag);
          if (
            flagLobby.flags[0].every(
              (val, i) => val === collectFlag.flagCoordinates[i],
            )
          ) {
            flagLobby.flags[0] = newFlag as number[];
          } else if (
            flagLobby.flags[1].every(
              (val, i) => val === collectFlag.flagCoordinates[i],
            )
          ) {
            flagLobby.flags[1] = newFlag as number[];
          }
          flagLobby.points[collectFlag.playerId] = (flagLobby.points[collectFlag.playerId] ?? 0) + 1;

          const newFlagResponse: MessageTypeResponse<NewFlagResponse> = {
            code: WebSocketResponses.NEW_FLAG,
            body: {
              flags: flagLobby.flags,
              playerId: collectFlag.playerId,
            },
          };
          ws.publish(collectFlag.lobbyId, newFlagResponse);
          ws.send(newFlagResponse);
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
      const lobby = lobbies[body.lobbyId];
      if (!lobby) return { success: false };
      if (lobby.lobbyStatus !== "waiting") return { success: false };

      const isUserAlreadyInLobby = Object.values(lobbies).some((l) =>
        l.members.includes(user.id),
      );
      if (isUserAlreadyInLobby) return { success: false };

      lobby.members.push(user.id);
      lobby.points[user.id] = 0;
      return { success: true };
    },
    {
      body: t.Object({
        lobbyId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
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
