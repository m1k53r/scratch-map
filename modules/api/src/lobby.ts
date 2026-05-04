import { customAlphabet } from "nanoid";
import { v4 as uuid } from "uuid";
import { db } from "./db";
import { lobby, user } from "./db/schema";
import Lobbies, { Lobby } from "./types/Lobby";

let lobbies: Lobbies = {};

export const createLobby = (
  hostId: string,
  isPublic: boolean,
  coordinates: [number, number],
) => {
  if (!hostId) {
    throw new Error("Host ID is required to create a lobby");
  }

  const joinCode = isPublic ? null : returnJoinCode();
  const lobby: Lobby = {
    id: uuid().toString(),
    hostId,
    lobbyStatus: "waiting",
    joinCode,
    minLat: coordinates[0],
    minLng: coordinates[1],
    maxLat: coordinates[0],
    maxLng: coordinates[1],
    members: [hostId],
    settings: {},
    createdAt: new Date(Date.now()),
  };
  return lobby;
};

export const returnJoinCode = () => {
  return customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6)();
};

export const joinLobby = (gameCode: string) => {};

export const leaveLobby = async (lobbyId: string, userId: string) => {};

export const closeLobby = async (lobbyId: string, userId: string) => {};
