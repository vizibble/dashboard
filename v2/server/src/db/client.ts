import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseSchema } from "@/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString);
export const db = drizzle({ client, schema: databaseSchema });
