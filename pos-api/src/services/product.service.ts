import { eq, and, ilike, sql } from "drizzle-orm";
import { db, DbOrTx } from "../db/client";
import { product } from "../models/product.model";
import { category } from "../models/category.model";
import { stockHistory } from "../models/stockHistory.model";

type ListParams = {
  category?: string;
  search?: string;
  sortBy?: "name" | "price" | "stockQuantity";
  order?: "asc" | "desc";
};

// sums stock_history for a product to get its current quantity
async function getCurrentStock(
  executor: DbOrTx,
  productId: number,
): Promise<number> {
  const [row] = await executor
    .select({
      total: sql<number>`coalesce(sum(${stockHistory.changeAmount}), 0)`,
    })
    .from(stockHistory)
    .where(eq(stockHistory.productId, productId));
  return Number(row?.total ?? 0);
}

// case-insensitive find, or create if it's a new category name
async function findOrCreateCategoryId(
  executor: DbOrTx,
  name: string,
): Promise<number> {
  const trimmed = name.trim();
  const [existing] = await executor
    .select()
    .from(category)
    .where(ilike(category.name, trimmed));
  if (existing) return existing.categoryId;

  const [created] = await executor
    .insert(category)
    .values({ name: trimmed })
    .returning();
  return created.categoryId;
}

export const productService = {
  async getAllProducts(params: ListParams = {}) {
    const conditions = [];
    if (params.category) conditions.push(ilike(category.name, params.category));
    if (params.search)
      conditions.push(ilike(product.name, `%${params.search}%`));

    const rows = await db
      .select({
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        category: category.name,
        stockQuantity: sql<number>`coalesce(sum(${stockHistory.changeAmount}), 0)`,
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.categoryId))
      .leftJoin(stockHistory, eq(stockHistory.productId, product.productId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(product.productId, category.name);

    // default sort: name ascending
    const field = params.sortBy ?? "name";
    const dir = params.order === "desc" ? -1 : 1;
    return rows.slice().sort((a, b) => {
      if (field === "name") return a.name.localeCompare(b.name) * dir;
      const av = field === "price" ? Number(a.price) : Number(a.stockQuantity);
      const bv = field === "price" ? Number(b.price) : Number(b.stockQuantity);
      return (av - bv) * dir;
    });
  },

  async getProductById(productId: number) {
    const [found] = await db
      .select({
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        category: category.name,
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.categoryId))
      .where(eq(product.productId, productId));
    if (!found) throw new Error("Product not found");

    const stockQuantity = await getCurrentStock(db, productId);
    return { ...found, stockQuantity };
  },

  // exact match by barcode — this is what a scanner hits at checkout
  async getProductByBarcode(barcode: string) {
    const [found] = await db
      .select({
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        category: category.name,
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.categoryId))
      .where(eq(product.barcode, barcode));
    if (!found) throw new Error("Product not found");

    const stockQuantity = await getCurrentStock(db, found.productId);
    return { ...found, stockQuantity };
  },

  async createProduct(data: {
    name: string;
    barcode?: string;
    price: number;
    category?: string;
    stockQuantity?: number;
    costPrice?: number;
  }) {
    return db.transaction(async (trx) => {
      const categoryId = data.category
        ? await findOrCreateCategoryId(trx, data.category)
        : undefined;

      const [created] = await trx
        .insert(product)
        .values({
          name: data.name,
          barcode: data.barcode,
          price: data.price.toString(),
          categoryId,
        })
        .returning();

      // starting stock, if any, goes into stock_history like everything else
      const initialStock = data.stockQuantity ?? 0;
      if (initialStock > 0) {
        await trx.insert(stockHistory).values({
          productId: created.productId,
          changeAmount: initialStock,
          reason: "restock",
          costPrice: data.costPrice?.toString(),
        });
      }

      return {
        ...created,
        category: data.category ?? null,
        stockQuantity: initialStock,
      };
    });
  },

  async updateProduct(
    productId: number,
    data: Partial<{
      name: string;
      barcode: string;
      price: number;
      category: string;
    }>,
  ) {
    return db.transaction(async (trx) => {
      const updateValues: Record<string, unknown> = {
        name: data.name,
        barcode: data.barcode,
        price: data.price !== undefined ? data.price.toString() : undefined,
      };
      if (data.category !== undefined) {
        updateValues.categoryId = await findOrCreateCategoryId(
          trx,
          data.category,
        );
      }
      // strip undefined keys so we don't overwrite fields that weren't sent
      Object.keys(updateValues).forEach(
        (k) => updateValues[k] === undefined && delete updateValues[k],
      );

      const [updated] = await trx
        .update(product)
        .set(updateValues)
        .where(eq(product.productId, productId))
        .returning();
      if (!updated) throw new Error("Product not found");

      const stockQuantity = await getCurrentStock(trx, productId);
      return { ...updated, category: data.category ?? null, stockQuantity };
    });
  },

  async deleteProduct(productId: number) {
    const [deleted] = await db
      .delete(product)
      .where(eq(product.productId, productId))
      .returning();
    if (!deleted) throw new Error("Product not found");
    return deleted;
  },

  async updateStock(
    productId: number,
    changeAmount: number,
    reason: string,
    costPrice?: number,
  ) {
    return db.transaction(async (trx) => {
      const [current] = await trx
        .select()
        .from(product)
        .where(eq(product.productId, productId));
      if (!current) throw new Error("Product not found");

      const currentStock = await getCurrentStock(trx, productId);
      const newQuantity = currentStock + changeAmount;
      if (newQuantity < 0) throw new Error("Stock cannot go below 0");

      await trx.insert(stockHistory).values({
        productId,
        changeAmount,
        reason,
        costPrice: costPrice?.toString(),
      });

      return { ...current, stockQuantity: newQuantity };
    });
  },
};
