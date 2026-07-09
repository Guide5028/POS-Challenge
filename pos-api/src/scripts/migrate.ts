import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set in .env");

  console.log("Connecting with DIRECT_URL...");
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running pending migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Done — migrations applied (or already up to date).");
  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:");
  console.error(err);
  process.exit(1);
});
