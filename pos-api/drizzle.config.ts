import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/models/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL!, // migrations need the session pooler, not the transaction pooler
  },
} satisfies Config;
