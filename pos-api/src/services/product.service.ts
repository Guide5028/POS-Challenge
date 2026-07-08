import { eq, and, ilike, asc, desc } from "drizzle-orm";
import { db } from "../db/client";
import { product } from "../models/product.model";
import { stock } from "../models/stock.model";

type ListParams = {
  categoryId?: number;
  search?: string;
  sortBy?: "name" | "price" | "stockQuantity";
  order?: "asc" | "desc";
};

const sortColumns = {
  name: product.name,
  price: product.price,
  stockQuantity: product.stockQuantity,
};

export const productService = {
  async getAllProducts(params: ListParams = {}) {
    const conditions = [];
    if (params.categoryId)
      conditions.push(eq(product.categoryId, params.categoryId));
    if (params.search)
      conditions.push(ilike(product.name, `%${params.search}%`));

    const orderColumn = sortColumns[params.sortBy ?? "name"];
    const orderFn = params.order === "desc" ? desc : asc;

    return db
      .select()
      .from(product)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderFn(orderColumn));
  },

  async getProductById(productId: number) {
    // Drizzle comparisons are eq(column, value) — not column.eq(value).
    const [found] = await db
      .select()
      .from(product)
      .where(eq(product.productId, productId));
    if (!found) throw new Error("Product not found");
    return found;
  },

  async createProduct(data: {
    name: string;
    barcode?: string;
    price: number;
    stockQuantity?: number;
    categoryId?: number;
  }) {
    const [created] = await db
      .insert(product)
      .values({
        name: data.name,
        barcode: data.barcode,
        price: data.price.toString(),
        stockQuantity: data.stockQuantity ?? 0,
        categoryId: data.categoryId,
      })
      .returning();
    return created;
  },

  async updateProduct(
    productId: number,
    data: Partial<{
      name: string;
      barcode: string;
      price: number;
      stockQuantity: number;
      categoryId: number;
    }>,
  ) {
    const updateValues: Record<string, unknown> = { ...data };
    if (data.price !== undefined) updateValues.price = data.price.toString();

    const [updated] = await db
      .update(product)
      .set(updateValues)
      .where(eq(product.productId, productId))
      .returning();
    if (!updated) throw new Error("Product not found");
    return updated;
  },

  async deleteProduct(productId: number) {
    const [deleted] = await db
      .delete(product)
      .where(eq(product.productId, productId))
      .returning();
    if (!deleted) throw new Error("Product not found");
    return deleted;
  },

  async updateStock(productId: number, changeAmount: number, reason: string) {
    return db.transaction(async (trx) => {
      const [current] = await trx
        .select()
        .from(product)
        .where(eq(product.productId, productId));
      if (!current) throw new Error("Product not found");

      const newQuantity = current.stockQuantity + changeAmount;
      if (newQuantity < 0) throw new Error("Stock cannot go below 0");

      const [updated] = await trx
        .update(product)
        .set({ stockQuantity: newQuantity })
        .where(eq(product.productId, productId))
        .returning();

      await trx.insert(stock).values({ productId, changeAmount, reason });

      return updated;
    });
  },
};
