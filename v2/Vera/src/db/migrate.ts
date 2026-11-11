import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabase, database } from "@/db/client";
import { logger } from "@/lib/logger";

/** Applies Vera's Drizzle migrations. Run once per deploy before the API and workers start. */
export async function runMigrations() {
  await migrate(database(), {
    migrationsFolder: `${import.meta.dir}/migrations`,
  });
}

if (import.meta.main) {
  await runMigrations();
  logger.info("Vera migrations applied");
  await closeDatabase();
}
