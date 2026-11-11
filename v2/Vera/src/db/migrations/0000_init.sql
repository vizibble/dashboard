CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"external_identity_id" text,
	"user_id" text NOT NULL,
	"organisation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_channel_check" CHECK ("conversations"."channel" in ('whatsapp'))
);
--> statement-breakpoint
CREATE TABLE "external_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"external_id_hash" text NOT NULL,
	"external_id_encrypted" text NOT NULL,
	"user_id" text NOT NULL,
	"grant_id" text NOT NULL,
	"grant_token_encrypted" text NOT NULL,
	"default_organisation_id" text,
	"active_organisation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "external_identities_channel_check" CHECK ("external_identities"."channel" in ('whatsapp'))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"external_message_id" text,
	"delivery_status" text,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_role_check" CHECK ("messages"."role" in ('user', 'assistant'))
);
--> statement-breakpoint
CREATE TABLE "pending_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"summary" text NOT NULL,
	"state_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"conversation_id" text,
	"request_id" text,
	"user_id" text NOT NULL,
	"organisation_id" text,
	"client_id" text,
	"tool_name" text NOT NULL,
	"status" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"duration_ms" integer NOT NULL,
	"result_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_calls_channel_check" CHECK ("tool_calls"."channel" in ('mcp', 'whatsapp')),
	CONSTRAINT "tool_calls_status_check" CHECK ("tool_calls"."status" in ('ok', 'error'))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"external_id" text NOT NULL,
	"message_type" text,
	"status" text DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "webhook_events_kind_check" CHECK ("webhook_events"."kind" in ('message', 'status')),
	CONSTRAINT "webhook_events_status_check" CHECK ("webhook_events"."status" in ('received', 'processed', 'ignored', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_external_identity_id_external_identities_id_fk" FOREIGN KEY ("external_identity_id") REFERENCES "public"."external_identities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_identity_idx" ON "conversations" USING btree ("external_identity_id","last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "external_identities_live_unique" ON "external_identities" USING btree ("channel","external_id_hash") WHERE "external_identities"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "external_identities_user_idx" ON "external_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_external_message_unique" ON "messages" USING btree ("external_message_id") WHERE "messages"."external_message_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "pending_approvals_conversation_unique" ON "pending_approvals" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "tool_calls_user_created_idx" ON "tool_calls" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "tool_calls_created_idx" ON "tool_calls" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_source_kind_external_unique" ON "webhook_events" USING btree ("source","kind","external_id");--> statement-breakpoint
CREATE INDEX "webhook_events_received_idx" ON "webhook_events" USING btree ("created_at");