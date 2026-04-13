import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia().use(openapi({ path: "/" })).listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
