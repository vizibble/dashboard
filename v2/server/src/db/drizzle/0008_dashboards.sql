-- Template versions carry their organisation so devices can only reference versions of their own templates.
ALTER TABLE "template_versions" ADD COLUMN "organization_id" text;--> statement-breakpoint
UPDATE "template_versions" AS tv SET "organization_id" = dt."organization_id" FROM "device_templates" AS dt WHERE dt."id" = tv."template_id";--> statement-breakpoint
ALTER TABLE "template_versions" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "device_templates" ADD CONSTRAINT "device_templates_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"location_id" text,
	"device_id" text,
	"created_by" text,
	"visibility" text DEFAULT 'organisation' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"time_range" text DEFAULT '24h' NOT NULL,
	"time_from" timestamp with time zone,
	"time_to" timestamp with time zone,
	"refresh_seconds" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboards_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "dashboards_scope_check" CHECK ("dashboards"."scope" in ('organisation', 'location', 'device')),
	CONSTRAINT "dashboards_visibility_check" CHECK ("dashboards"."visibility" in ('private', 'organisation')),
	CONSTRAINT "dashboards_scope_target_check" CHECK (("dashboards"."scope" = 'organisation' and "dashboards"."location_id" is null and "dashboards"."device_id" is null)
        or ("dashboards"."scope" = 'location' and "dashboards"."location_id" is not null and "dashboards"."device_id" is null)
        or ("dashboards"."scope" = 'device' and "dashboards"."device_id" is not null and "dashboards"."location_id" is null)),
	CONSTRAINT "dashboards_custom_range_check" CHECK (("dashboards"."time_range" = 'custom') = ("dashboards"."time_from" is not null and "dashboards"."time_to" is not null)
        and ("dashboards"."time_from" is null or "dashboards"."time_from" < "dashboards"."time_to")),
	CONSTRAINT "dashboards_refresh_check" CHECK ("dashboards"."refresh_seconds" = 0 or "dashboards"."refresh_seconds" between 10 and 3600)
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"dashboard_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"metric_key" text NOT NULL,
	"aggregation" text NOT NULL,
	"bucket_size" text DEFAULT 'auto' NOT NULL,
	"split_by_device" boolean DEFAULT true NOT NULL,
	"time_range" text,
	"time_from" timestamp with time zone,
	"time_to" timestamp with time zone,
	"latitude_metric" text,
	"longitude_metric" text,
	"decimals" integer,
	"show_unit" boolean DEFAULT true NOT NULL,
	"show_legend" boolean DEFAULT true NOT NULL,
	"color" text,
	"min_value" numeric(30, 10),
	"max_value" numeric(30, 10),
	"true_label" text,
	"false_label" text,
	"sort_order" integer NOT NULL,
	"width" integer DEFAULT 4 NOT NULL,
	"height" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_widgets_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "dashboard_widgets_type_check" CHECK ("dashboard_widgets"."type" in ('kpi', 'line', 'area', 'bar', 'gauge', 'state', 'table', 'map')),
	CONSTRAINT "dashboard_widgets_aggregation_check" CHECK ("dashboard_widgets"."aggregation" in ('latest', 'raw', 'avg', 'min', 'max', 'sum', 'count')),
	CONSTRAINT "dashboard_widgets_bucket_size_check" CHECK ("dashboard_widgets"."bucket_size" in ('auto', '1m', '5m', '15m', '1h', '6h', '1d', '1w')),
	CONSTRAINT "dashboard_widgets_custom_range_check" CHECK (("dashboard_widgets"."time_range" is not distinct from 'custom') = ("dashboard_widgets"."time_from" is not null and "dashboard_widgets"."time_to" is not null)
        and ("dashboard_widgets"."time_from" is null or "dashboard_widgets"."time_from" < "dashboard_widgets"."time_to")),
	CONSTRAINT "dashboard_widgets_map_metrics_check" CHECK (("dashboard_widgets"."type" = 'map') = ("dashboard_widgets"."latitude_metric" is not null and "dashboard_widgets"."longitude_metric" is not null)),
	CONSTRAINT "dashboard_widgets_layout_check" CHECK ("dashboard_widgets"."width" between 1 and 12 and "dashboard_widgets"."height" between 1 and 8 and "dashboard_widgets"."sort_order" >= 0),
	CONSTRAINT "dashboard_widgets_decimals_check" CHECK ("dashboard_widgets"."decimals" is null or "dashboard_widgets"."decimals" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "dashboard_widget_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"widget_id" text NOT NULL,
	"device_id" text,
	"location_id" text,
	"include_child_locations" boolean DEFAULT true NOT NULL,
	CONSTRAINT "dashboard_widget_sources_one_target_check" CHECK (num_nonnulls("dashboard_widget_sources"."device_id", "dashboard_widget_sources"."location_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "dashboard_widget_thresholds" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"widget_id" text NOT NULL,
	"value" numeric(30, 10) NOT NULL,
	"color" text NOT NULL,
	"label" text,
	CONSTRAINT "dashboard_widget_thresholds_widget_value_unique" UNIQUE("widget_id","value")
);
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_location_same_organization_fk" FOREIGN KEY ("organization_id","location_id") REFERENCES "public"."locations"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_device_same_organization_fk" FOREIGN KEY ("organization_id","device_id") REFERENCES "public"."devices"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_same_organization_fk" FOREIGN KEY ("organization_id","dashboard_id") REFERENCES "public"."dashboards"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widget_sources" ADD CONSTRAINT "dashboard_widget_sources_widget_same_organization_fk" FOREIGN KEY ("organization_id","widget_id") REFERENCES "public"."dashboard_widgets"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widget_sources" ADD CONSTRAINT "dashboard_widget_sources_device_same_organization_fk" FOREIGN KEY ("organization_id","device_id") REFERENCES "public"."devices"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widget_sources" ADD CONSTRAINT "dashboard_widget_sources_location_same_organization_fk" FOREIGN KEY ("organization_id","location_id") REFERENCES "public"."locations"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widget_thresholds" ADD CONSTRAINT "dashboard_widget_thresholds_widget_same_organization_fk" FOREIGN KEY ("organization_id","widget_id") REFERENCES "public"."dashboard_widgets"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboards_default_unique" ON "dashboards" USING btree ("organization_id","scope",coalesce("location_id", "device_id", '')) WHERE "dashboards"."is_default";--> statement-breakpoint
CREATE INDEX "dashboards_organization_scope_idx" ON "dashboards" USING btree ("organization_id","scope");--> statement-breakpoint
CREATE INDEX "dashboard_widgets_dashboard_sort_order_idx" ON "dashboard_widgets" USING btree ("dashboard_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_widget_sources_widget_device_unique" ON "dashboard_widget_sources" USING btree ("widget_id","device_id") WHERE "dashboard_widget_sources"."device_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_widget_sources_widget_location_unique" ON "dashboard_widget_sources" USING btree ("widget_id","location_id") WHERE "dashboard_widget_sources"."location_id" is not null;--> statement-breakpoint
CREATE INDEX "dashboard_widget_sources_device_id_idx" ON "dashboard_widget_sources" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "dashboard_widget_sources_location_id_idx" ON "dashboard_widget_sources" USING btree ("location_id");--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_template_version_same_organization_fk" FOREIGN KEY ("organization_id","template_version_id") REFERENCES "public"."template_versions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_same_organization_fk" FOREIGN KEY ("organization_id","template_id") REFERENCES "public"."device_templates"("organization_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- GPS parameters for map widgets.
INSERT INTO "metric_definitions" ("id", "organization_id", "key", "label", "unit", "symbol", "data_type", "category") VALUES
  (gen_random_uuid()::text, NULL, 'latitude', 'Latitude', 'Degree', '°', 'number', 'Position'),
  (gen_random_uuid()::text, NULL, 'longitude', 'Longitude', 'Degree', '°', 'number', 'Position')
ON CONFLICT DO NOTHING;
