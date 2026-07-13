import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { category } from "../models/category.model";

type CreateCategoryInput = {
  name: string;
  description?: string;
  isActive?: boolean;
};

export const categoryService = {
  async getAllCategories(activeOnly = false) {
    const rows = await db.select().from(category);
    if (!activeOnly) return rows;
    return rows.filter((c) => c.isActive);
  },

  async getCategoryById(categoryId: number) {
    const [found] = await db
      .select()
      .from(category)
      .where(eq(category.categoryId, categoryId));
    if (!found) throw new Error("Category not found");
    return found;
  },

  async createCategory(data: CreateCategoryInput) {
    const [created] = await db
      .insert(category)
      .values({
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      })
      .returning();
    return created;
  },

  async updateCategory(categoryId: number, data: Partial<CreateCategoryInput>) {
    const updateValues: Record<string, unknown> = { ...data };
    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k],
    );

    const [updated] = await db
      .update(category)
      .set(updateValues)
      .where(eq(category.categoryId, categoryId))
      .returning();
    if (!updated) throw new Error("Category not found");
    return updated;
  },

  async deleteCategory(categoryId: number) {
    try {
      const [deleted] = await db
        .delete(category)
        .where(eq(category.categoryId, categoryId))
        .returning();
      if (!deleted) throw new Error("Category not found");
      return deleted;
    } catch (err) {
      // drizzle-orm wraps the real postgres error in DrizzleQueryError; the
      // actual PostgresError (with .code) lives on .cause, not the top level
      const code = (err as { cause?: { code?: string } }).cause?.code;
      // 23503 = foreign_key_violation — a product or promotion still points at this category
      if (code === "23503") {
        throw new Error(
          "Cannot delete category — it's still used by existing products or promotions. Disable it instead.",
        );
      }
      throw err;
    }
  },
};
