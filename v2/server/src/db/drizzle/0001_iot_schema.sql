CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"device_key" text NOT NULL,
	"template_version_id" text NOT NULL,
	"location_id" text NOT NULL,
	CONSTRAINT "devices_device_key_unique" UNIQUE("device_key")
);
--> statement-breakpoint
CREATE TABLE "device_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry" (
	"device_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"value_numeric" numeric(30, 10) NOT NULL,
	CONSTRAINT "telemetry_device_id_metric_key_timestamp_pk" PRIMARY KEY("device_id","metric_key","timestamp")
);
--> statement-breakpoint
CREATE TABLE "template_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"template_version_id" text NOT NULL,
	"key" text NOT NULL,
	"data_type" text NOT NULL,
	"unit" text,
	"label" text NOT NULL,
	CONSTRAINT "template_metrics_version_id_key_unique" UNIQUE("template_version_id","key")
);
--> statement-breakpoint
CREATE TABLE "template_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_versions_template_id_version_unique" UNIQUE("template_id","version")
);
--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_template_version_id_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."template_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD CONSTRAINT "template_metrics_template_version_id_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."template_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_id_device_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."device_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_template_version_id_idx" ON "devices" USING btree ("template_version_id");--> statement-breakpoint
CREATE INDEX "devices_location_id_idx" ON "devices" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "locations_organization_id_idx" ON "locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "locations_parent_id_idx" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "template_metrics_template_version_id_idx" ON "template_metrics" USING btree ("template_version_id");