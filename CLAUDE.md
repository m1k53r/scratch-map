# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Grid Wars** is a location-based multiplayer game where players draw map areas, create lobbies, and collect flags within those areas in real-time. It's a Bun monorepo with two modules and one shared package:

- `modules/api` — Elysia (Bun) HTTP + WebSocket backend
- `modules/grid-wars` — React Native / Expo mobile frontend
- `packages/types` — shared TypeScript types (`@gridwars/types`) consumed by both modules

## Commands

### Root (run from repo root)
```bash
bun install         # install all workspaces
bun dev             # run API + Expo concurrently (yellow=api, blue=grid-wars)
bun run start:api   # API only (port 8080 HTTP, 3080 WS)
bun run start:grid-wars  # Expo only
```

### API (`modules/api`)
```bash
bun run dev         # start with file watching
```

### Mobile (`modules/grid-wars`)
```bash
bun run start       # expo start
bun run android     # run on Android
bun run ios         # run on iOS
bun run lint        # eslint via expo
```

### Database migrations (`modules/api`)
```bash
bunx drizzle-kit generate   # generate migration from schema changes
bunx drizzle-kit migrate    # apply migrations
```

## Environment Variables

**`modules/api/.env`** (copy from `.env.example`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BACKEND_URL` / `BETTER_AUTH_URL` — public URL of the API server
- `BETTER_AUTH_SECRET` — random secret for better-auth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — OAuth credentials

**`modules/grid-wars/.env`** (copy from `.env.example`):
- `EXPO_PUBLIC_BACKEND_URL` — URL of the API (used by Eden treaty client)
- `EXPO_PUBLIC_MAPBOX_API_KEY` — Mapbox access token (set via `Mapbox.setAccessToken`)

## Architecture

### API (`modules/api/src/`)

The backend is a single Elysia app with two servers:
- **HTTP server** on port 8080 (`app`) — REST endpoints + auth
- **WebSocket server** on port 3080 (`websocket`) — real-time game events

**Lobby state is entirely in-memory** (`lobbies: Lobbies` object in `index.ts`). There's a Drizzle/Neon DB schema (`db/schema.ts`) but it's not used for active game state — the DB only persists auth data (users, sessions, accounts).

Auth is handled by **better-auth** with GitHub OAuth and the expo plugin. The `betterAuth` Elysia macro adds `auth: true` to routes requiring authentication, which resolves to `{ user, session }` in the handler.

The API type (`App`) is exported and re-exported via `packages/types/index.ts` so the frontend can use **Eden treaty** for end-to-end type-safe HTTP calls.

### WebSocket Protocol

Messages follow a typed envelope: `{ code: WebSocketCodes | WebSocketResponses, body: T }`.

**Client → Server** (`WebSocketCodes` enum in `@gridwars/types`):
- `PLAYER_JOINED` / `PLAYER_LEFT` — subscribe/unsubscribe from a lobby channel
- `START_GAME` — host starts the game; backend generates 2 random flags within the polygon
- `COLLECT_FLAG` — player reached a flag; backend replaces it with a new random one and increments points
- `END_GAME` — unused

**Server → Client** (`WebSocketResponses` enum):
- `LOBBIES_SYNC` — sent on WebSocket open; full list of active lobbies
- `LOBBY_CREATED` / `LOBBY_CLOSED` — broadcast to all clients
- `GAME_STARTED` — contains initial flag coordinates
- `GAME_ENDED` — contains winner player ID
- `NEW_FLAG` — updated flag positions + scorer ID
- `PLAYER_JOINED` / `PLAYER_LEFT` — lobby-scoped pub/sub

### Frontend (`modules/grid-wars/src/`)

**State management**: Zustand store (`stores/useLobby.ts`) holds all lobbies on the map and `currentLobby` (the ID of the lobby the current user is in).

**WebSocket**: `lib/websocket-client.ts` exports `useWebSocket` hook that subscribes via Eden's `client.ws.subscribe()`. It's mounted once in `SocketContext.tsx` (`SocketProvider`) which wraps the app layout. Components access the socket ref via `useSocket()`.

**Routing**: Expo Router file-based routing. `app/_layout.tsx` is the root — it guards `(app)` routes behind `authClient.useSession()`. The main game screen is `app/(app)/index.tsx`.

**Map**: `@rnmapbox/maps` for the Mapbox map. Lobby polygons are rendered as `FillLayer` shapes. Flag markers and the player's own location marker are rendered as `MarkerView`. Area selection works by tapping the map to accumulate polygon points.

**Game loop** (in `app/(app)/index.tsx`):
1. User draws a polygon on the map → sets `params.points`
2. `createLobby` POST → backend creates lobby in memory, broadcasts `LOBBY_CREATED`
3. Host sends `START_GAME` WebSocket message → backend generates 2 flags, starts timeout timer
4. Location updates checked against flag coordinates — if within 10m, `COLLECT_FLAG` is sent
5. After `timeLimit` minutes, backend broadcasts `GAME_ENDED`

### Shared Types (`packages/types/index.ts`)

Exports WebSocket enums, message interfaces, `gameState` type, and re-exports `App` from the API for Eden treaty typing.
