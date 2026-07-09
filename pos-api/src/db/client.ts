import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const queryClient = postgres(connectionString, { prepare: false });
export const db = drizzle(queryClient, { schema });

// `db` and the `trx` from db.transaction() are different TS types even
// though they behave the same at runtime, so helpers that need to work with
// either one should take `DbOrTx`, not `typeof db`.
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Transaction;
