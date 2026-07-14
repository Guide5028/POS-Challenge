import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { employee } from "../models/employee.model";

// never select passwordHash out to the API
const publicColumns = {
  employeeId: employee.employeeId,
  name: employee.name,
  email: employee.email,
  role: employee.role,
  isActive: employee.isActive,
  profileComplete: employee.profileComplete,
};

export const employeeService = {
  async getAllEmployees() {
    return db.select(publicColumns).from(employee);
  },

  async updateEmployee(
    employeeId: number,
    data: { isActive?: boolean; role?: "cashier" | "admin" },
  ) {
    const [updated] = await db
      .update(employee)
      .set(data)
      .where(eq(employee.employeeId, employeeId))
      .returning(publicColumns);
    if (!updated) throw new Error("Employee not found");
    return updated;
  },
};
