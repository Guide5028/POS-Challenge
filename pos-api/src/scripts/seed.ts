import "dotenv/config";
import { db } from "../db/client";
import { employee } from "../models/employee.model";
import { hashPassword } from "../utils/password";
import { eq } from "drizzle-orm";

// One-off script to bootstrap the first admin + cashier accounts.
// There's no public "become an admin" endpoint on purpose — this is the
// only way the very first admin gets created. Run with: npm run db:seed
const accounts = [
  { name: "Admin User", email: "admin@pos.com", password: "Admin@12345", role: "admin" as const },
  { name: "Cashier User", email: "cashier@pos.com", password: "Cashier@12345", role: "cashier" as const },
];

async function seed() {
  for (const acc of accounts) {
    const [existing] = await db.select().from(employee).where(eq(employee.email, acc.email));
    if (existing) {
      console.log(`Skipped ${acc.email} — already exists`);
      continue;
    }

    const passwordHash = await hashPassword(acc.password);
    await db.insert(employee).values({
      name: acc.name,
      email: acc.email,
      passwordHash,
      role: acc.role,
    });
    console.log(`Created ${acc.role}: ${acc.email} / ${acc.password}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
