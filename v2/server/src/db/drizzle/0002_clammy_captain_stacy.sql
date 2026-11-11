ALTER TABLE "locations" DROP CONSTRAINT "locations_parent_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "telemetry" DROP CONSTRAINT "telemetry_device_id_devices_id_fk";
--> statement-breakpoint
ALTER TABLE "telemetry" DROP CONSTRAINT "telemetry_device_id_metric_key_timestamp_pk";
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "organization_id" text;
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "device_templates" ADD COLUMN "organization_id" text;
--> statement-breakpoint
ALTER TABLE "device_templates" ADD COLUMN "is_global" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD COLUMN "id" text;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD COLUMN "value_text" text;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD COLUMN "value_boolean" boolean;
--> statement-breakpoint
ALTER TABLE "telemetry" ALTER COLUMN "value_numeric" DROP NOT NULL;
--> statement-breakpoint
UPDATE "devices" AS d
SET "organization_id" = l."organization_id"
FROM "locations" AS l
WHERE d."location_id" = l."id";
--> statement-breakpoint
ALTER TABLE "devices" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
UPDATE "telemetry"
SET "id" = gen_random_uuid()::text
WHERE "id" IS NULL;
--> statement-breakpoint
ALTER TABLE "telemetry" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_pkey" PRIMARY KEY("id");
--> statement-breakpoint
UPDATE "locations" AS child
SET "parent_id" = NULL
FROM "locations" AS parent
WHERE child."parent_id" = parent."id"
  AND child."organization_id" <> parent."organization_id";
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_id_unique" UNIQUE("organization_id","id");
--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_location_same_organization_fk" FOREIGN KEY ("organization_id","location_id") REFERENCES "public"."locations"("organization_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "device_templates" ADD CONSTRAINT "device_templates_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_same_organization_fk" FOREIGN KEY ("organization_id","parent_id") REFERENCES "public"."locations"("organization_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devices_organization_id_idx" ON "devices" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "device_templates_organization_id_idx" ON "device_templates" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "telemetry_device_metric_timestamp_idx" ON "telemetry" USING btree ("device_id","metric_key","timestamp");
--> statement-breakpoint
CREATE INDEX "telemetry_timestamp_idx" ON "telemetry" USING btree ("timestamp");
--> statement-breakpoint
CREATE INDEX "template_versions_template_id_idx" ON "template_versions" USING btree ("template_id");
--> statement-breakpoint
ALTER TABLE "device_templates" ADD CONSTRAINT "device_templates_sharing_check" CHECK (("is_global" and "organization_id" is null) or (not "is_global" and "organization_id" is not null));
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_type_check" CHECK ("type" in ('site', 'building', 'floor', 'room', 'zone')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_exactly_one_value_check" CHECK (num_nonnulls("value_numeric", "value_text", "value_boolean") = 1);
--> statement-breakpoint
ALTER TABLE "template_metrics" ADD CONSTRAINT "template_metrics_data_type_check" CHECK ("data_type" in ('number', 'integer', 'string', 'boolean')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_version_positive_check" CHECK ("version" > 0) NOT VALID;
--> statement-breakpoint
CREATE FUNCTION "validate_location_hierarchy"() RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  current_parent text;
  next_parent text;
  visited text[] := ARRAY[]::text[];
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.organization_id));
  current_parent := NEW.parent_id;

  WHILE current_parent IS NOT NULL LOOP
    IF current_parent = NEW.id OR current_parent = ANY(visited) THEN
      RAISE EXCEPTION 'Location hierarchy cannot contain a cycle'
        USING ERRCODE = '23514';
    END IF;

    visited := array_append(visited, current_parent);
    SELECT parent_id INTO next_parent
    FROM locations
    WHERE id = current_parent
      AND organization_id = NEW.organization_id;

    IF NOT FOUND THEN
      EXIT;
    END IF;
    current_parent := next_parent;
  END LOOP;

  RETURN NEW;
END;
$function$;
--> statement-breakpoint
CREATE TRIGGER "locations_hierarchy_cycle_check"
BEFORE INSERT OR UPDATE OF "organization_id", "parent_id" ON "locations"
FOR EACH ROW EXECUTE FUNCTION "validate_location_hierarchy"();
--> statement-breakpoint
CREATE FUNCTION "validate_device_template_scope"() RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  template_organization_id text;
  template_is_global boolean;
BEGIN
  SELECT t.organization_id, t.is_global
  INTO template_organization_id, template_is_global
  FROM template_versions AS v
  INNER JOIN device_templates AS t ON t.id = v.template_id
  WHERE v.id = NEW.template_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template version does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF NOT template_is_global
     AND template_organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Device template must be global or owned by its organization'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;
--> statement-breakpoint
CREATE TRIGGER "devices_template_scope_check"
BEFORE INSERT OR UPDATE OF "organization_id", "template_version_id" ON "devices"
FOR EACH ROW EXECUTE FUNCTION "validate_device_template_scope"();
--> statement-breakpoint
CREATE FUNCTION "validate_telemetry_metric_type"() RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  metric_data_type text;
BEGIN
  SELECT m.data_type
  INTO metric_data_type
  FROM devices AS d
  INNER JOIN template_metrics AS m
    ON m.template_version_id = d.template_version_id
   AND m.key = NEW.metric_key
  WHERE d.id = NEW.device_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Telemetry metric is not defined by the device template'
      USING ERRCODE = '23514';
  END IF;

  IF metric_data_type IN ('number', 'integer') THEN
    IF NEW.value_numeric IS NULL
       OR NEW.value_text IS NOT NULL
       OR NEW.value_boolean IS NOT NULL THEN
      RAISE EXCEPTION 'Telemetry value does not match the numeric metric type'
        USING ERRCODE = '23514';
    END IF;
    IF metric_data_type = 'integer'
       AND NEW.value_numeric <> trunc(NEW.value_numeric) THEN
      RAISE EXCEPTION 'Integer metrics require integer values'
        USING ERRCODE = '23514';
    END IF;
  ELSIF metric_data_type = 'string' THEN
    IF NEW.value_text IS NULL
       OR NEW.value_numeric IS NOT NULL
       OR NEW.value_boolean IS NOT NULL THEN
      RAISE EXCEPTION 'Telemetry value does not match the string metric type'
        USING ERRCODE = '23514';
    END IF;
  ELSIF metric_data_type = 'boolean' THEN
    IF NEW.value_boolean IS NULL
       OR NEW.value_numeric IS NOT NULL
       OR NEW.value_text IS NOT NULL THEN
      RAISE EXCEPTION 'Telemetry value does not match the boolean metric type'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
--> statement-breakpoint
CREATE TRIGGER "telemetry_metric_type_check"
BEFORE INSERT OR UPDATE OF "device_id", "metric_key", "value_numeric", "value_text", "value_boolean" ON "telemetry"
FOR EACH ROW EXECUTE FUNCTION "validate_telemetry_metric_type"();
