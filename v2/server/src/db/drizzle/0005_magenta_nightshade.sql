ALTER TABLE "locations" ADD COLUMN "can_have_children" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "locations" AS parent
SET "can_have_children" = true
WHERE EXISTS (
  SELECT 1
  FROM "locations" AS child
  WHERE child."parent_id" = parent."id"
);