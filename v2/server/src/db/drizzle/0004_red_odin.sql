CREATE TEMP TABLE "_global_template_organization_map" (
	"original_template_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"new_template_id" text NOT NULL,
	PRIMARY KEY ("original_template_id", "organization_id")
);--> statement-breakpoint
INSERT INTO "_global_template_organization_map" ("original_template_id", "organization_id", "new_template_id")
SELECT DISTINCT t."id", d."organization_id", gen_random_uuid()::text
FROM "device_templates" t
INNER JOIN "template_versions" v ON v."template_id" = t."id"
INNER JOIN "devices" d ON d."template_version_id" = v."id"
WHERE t."organization_id" IS NULL;--> statement-breakpoint
INSERT INTO "device_templates" ("id", "organization_id", "name", "description")
SELECT m."new_template_id", m."organization_id", t."name", t."description"
FROM "_global_template_organization_map" m
INNER JOIN "device_templates" t ON t."id" = m."original_template_id";--> statement-breakpoint
CREATE TEMP TABLE "_global_template_version_map" (
	"original_version_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"new_version_id" text NOT NULL,
	PRIMARY KEY ("original_version_id", "organization_id")
);--> statement-breakpoint
INSERT INTO "_global_template_version_map" ("original_version_id", "organization_id", "new_version_id")
SELECT v."id", m."organization_id", gen_random_uuid()::text
FROM "_global_template_organization_map" m
INNER JOIN "template_versions" v ON v."template_id" = m."original_template_id";--> statement-breakpoint
INSERT INTO "template_versions" ("id", "template_id", "version", "created_at")
SELECT vm."new_version_id", m."new_template_id", v."version", v."created_at"
FROM "_global_template_version_map" vm
INNER JOIN "template_versions" v ON v."id" = vm."original_version_id"
INNER JOIN "_global_template_organization_map" m
	ON m."original_template_id" = v."template_id"
	AND m."organization_id" = vm."organization_id";--> statement-breakpoint
INSERT INTO "template_metrics" ("id", "template_version_id", "key", "data_type", "unit", "label")
SELECT gen_random_uuid()::text, vm."new_version_id", metric."key", metric."data_type", metric."unit", metric."label"
FROM "_global_template_version_map" vm
INNER JOIN "template_metrics" metric ON metric."template_version_id" = vm."original_version_id";--> statement-breakpoint
UPDATE "devices" d
SET "template_version_id" = vm."new_version_id"
FROM "_global_template_version_map" vm
WHERE d."template_version_id" = vm."original_version_id"
	AND d."organization_id" = vm."organization_id";--> statement-breakpoint
DELETE FROM "device_templates" WHERE "organization_id" IS NULL;--> statement-breakpoint
DROP TABLE "_global_template_version_map";--> statement-breakpoint
DROP TABLE "_global_template_organization_map";--> statement-breakpoint
ALTER TABLE "device_templates" DROP CONSTRAINT "device_templates_sharing_check";--> statement-breakpoint
ALTER TABLE "device_templates" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device_templates" DROP COLUMN "is_global";--> statement-breakpoint
CREATE OR REPLACE FUNCTION "validate_device_template_scope"() RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  template_organization_id text;
BEGIN
  SELECT t.organization_id
  INTO template_organization_id
  FROM template_versions AS v
  INNER JOIN device_templates AS t ON t.id = v.template_id
  WHERE v.id = NEW.template_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template version does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF template_organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Device template must belong to its organization'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;