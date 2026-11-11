import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/config/env";
import * as schema from "@/db/schema";

function create() {
  const client = postgres(env().VERA_DATABASE_URL, {
    max: 10,
    onnotice: () => {},
  });
  return { client, db: drizzle({ client, schema }) };
}

let instance: ReturnType<typeof create> | undefined;

export function database() {
  instance ??= create();
  return instance.db;
}

export type Database = ReturnType<typeof database>;

export async function closeDatabase() {
  await instance?.client.end({ timeout: 5 });
  instance = undefined;
}

export async function pingDatabase() {
  await database().execute("select 1");
}
