import { customAlphabet } from "nanoid";
import { v4 as uuid } from "uuid";
import { db } from "./db";
import { lobby, user } from "./db/schema";
import Lobbies, { Lobby } from "./types/Lobby";

export const createLobby = (
  hostId: string,
  isPublic: boolean,
  coordinates: [number, number][],
  membersLimit: number,
  timeLimit: number,
) => {
  if (!hostId) {
    throw new Error("Host ID is required to create a lobby");
  }

  const joinCode = isPublic ? null : generateJoinCode();
  const lobby: Lobby = {
    id: uuid().toString(),
    hostId,
    lobbyStatus: "waiting",
    joinCode,
    coordinates,
    members: [hostId],
    settings: {
      membersLimit,
      timeLimit,
    },
    createdAt: new Date(Date.now()),
  };
  return lobby;
};

export const generateJoinCode = () => {
  return customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6)();
};

export const joinLobby = (gameCode: string) => {};

export const leaveLobby = async (lobbyId: string, userId: string) => {};
