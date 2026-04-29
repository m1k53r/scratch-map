CREATE TYPE "public"."lobby_status" AS ENUM('waiting', 'active', 'game_started');--> statement-breakpoint
CREATE TABLE "lobby" (
	"id" uuid PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"lobby_status" "lobby_status" NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"join_code" varchar(6) NOT NULL,
	"min_lat" double precision NOT NULL,
	"min_lng" double precision NOT NULL,
	"max_lat" double precision NOT NULL,
	"max_lng" double precision NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lobby_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "lobby_member" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lobby_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby" ADD CONSTRAINT "lobby_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_member" ADD CONSTRAINT "lobby_member_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_member" ADD CONSTRAINT "lobby_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_lobby_user" ON "lobby_member" USING btree ("lobby_id","user_id");