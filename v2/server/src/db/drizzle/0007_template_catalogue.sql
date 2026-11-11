CREATE TABLE "metric_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"unit" text,
	"symbol" text,
	"data_type" text NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metric_definitions_data_type_check" CHECK ("metric_definitions"."data_type" in ('number', 'integer', 'string', 'boolean'))
);
--> statement-breakpoint
DROP INDEX "locations_parent_id_idx";--> statement-breakpoint
ALTER TABLE "devices" ALTER COLUMN "location_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "device_templates" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD COLUMN "symbol" text;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD COLUMN "metric_definition_id" text;--> statement-breakpoint
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definitions_builtin_key_unique" ON "metric_definitions" USING btree ("key") WHERE "metric_definitions"."organization_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definitions_organization_key_unique" ON "metric_definitions" USING btree ("organization_id","key") WHERE "metric_definitions"."organization_id" is not null;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD CONSTRAINT "template_metrics_metric_definition_id_metric_definitions_id_fk" FOREIGN KEY ("metric_definition_id") REFERENCES "public"."metric_definitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_organization_parent_idx" ON "locations" USING btree ("organization_id","parent_id");--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_active_has_location_check" CHECK ("devices"."deleted_at" is not null or "devices"."location_id" is not null);--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_no_self_parent_check" CHECK ("locations"."id" <> "locations"."parent_id");--> statement-breakpoint
-- Built-in telemetry parameter catalogue (shared by all organisations).
INSERT INTO "metric_definitions" ("id", "organization_id", "key", "label", "unit", "symbol", "data_type", "category") VALUES
  (gen_random_uuid()::text, NULL, 'temperature', 'Temperature', 'Celsius', '°C', 'number', 'Environment'),
  (gen_random_uuid()::text, NULL, 'humidity', 'Humidity', 'Percent', '%', 'number', 'Environment'),
  (gen_random_uuid()::text, NULL, 'co2', 'CO₂', 'Parts per million', 'ppm', 'number', 'Environment'),
  (gen_random_uuid()::text, NULL, 'pressure', 'Pressure', 'Bar', 'bar', 'number', 'Process'),
  (gen_random_uuid()::text, NULL, 'flow_rate', 'Flow rate', 'Litres per minute', 'L/min', 'number', 'Process'),
  (gen_random_uuid()::text, NULL, 'level', 'Level', 'Percent', '%', 'number', 'Process'),
  (gen_random_uuid()::text, NULL, 'voltage', 'Voltage', 'Volt', 'V', 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'current', 'Current', 'Ampere', 'A', 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'power', 'Power', 'Kilowatt', 'kW', 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'energy', 'Energy', 'Kilowatt hour', 'kWh', 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'power_factor', 'Power factor', NULL, NULL, 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'frequency', 'Frequency', 'Hertz', 'Hz', 'number', 'Electrical'),
  (gen_random_uuid()::text, NULL, 'rpm', 'Speed', 'Revolutions per minute', 'RPM', 'number', 'Machine'),
  (gen_random_uuid()::text, NULL, 'vibration', 'Vibration', 'Millimetres per second', 'mm/s', 'number', 'Machine'),
  (gen_random_uuid()::text, NULL, 'running', 'Running', NULL, NULL, 'boolean', 'Machine'),
  (gen_random_uuid()::text, NULL, 'status', 'Status', NULL, NULL, 'string', 'Machine'),
  (gen_random_uuid()::text, NULL, 'count', 'Count', NULL, NULL, 'integer', 'Production'),
  (gen_random_uuid()::text, NULL, 'length', 'Length', 'Metre', 'm', 'number', 'Production'),
  (gen_random_uuid()::text, NULL, 'weight', 'Weight', 'Kilogram', 'kg', 'number', 'Production'),
  (gen_random_uuid()::text, NULL, 'battery', 'Battery', 'Percent', '%', 'number', 'Device'),
  (gen_random_uuid()::text, NULL, 'signal_strength', 'Signal strength', 'Decibel-milliwatts', 'dBm', 'number', 'Device')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Link existing template parameters to the catalogue by key, and carry their unit over as the symbol.
UPDATE "template_metrics" AS tm
SET "metric_definition_id" = md."id", "symbol" = COALESCE(tm."unit", md."symbol")
FROM "metric_definitions" AS md
WHERE md."organization_id" IS NULL AND md."key" = tm."key";
--> statement-breakpoint
UPDATE "template_metrics" SET "symbol" = "unit" WHERE "symbol" IS NULL AND "unit" IS NOT NULL;
--> statement-breakpoint
-- Devices now always follow their template's current configuration.
UPDATE "devices" AS d
SET "template_version_id" = latest."id"
FROM "template_versions" AS current_version
JOIN LATERAL (
  SELECT tv."id" FROM "template_versions" AS tv
  WHERE tv."template_id" = current_version."template_id"
  ORDER BY tv."version" DESC
  LIMIT 1
) AS latest ON true
WHERE d."template_version_id" = current_version."id" AND d."template_version_id" <> latest."id";
