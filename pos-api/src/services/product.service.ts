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
  activeOnly?: boolean;
  page?: number;
  limit?: number;
};

// drizzle-orm wraps the real postgres error in DrizzleQueryError; the actual
// PostgresError (with .code and .constraint) lives on .cause, not the top level.
// Without this, a duplicate barcode or sku (both unique columns on product) fell
// all the way through the controller's generic catch as an opaque 500 instead of
// a message that actually says what's wrong -- same class of bug deleteProduct's
// own catch below already handles for foreign-key violations.
function translateProductError(err: unknown): Error {
  const cause = (err as { cause?: { code?: string; constraint?: string } }).cause;
  // 23505 = unique_violation
  if (cause?.code === "23505") {
    const field = cause.constraint?.includes("barcode") ? "barcode" : "SKU";
    return new Error(`A product with this ${field} already exists`);
  }
  return err as Error;
}

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
    if (params.activeOnly) conditions.push(eq(product.isActive, true));

    const rows = await db
      .select({
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        category: category.name,
        isActive: product.isActive,
        imageUrl: product.imageUrl,
        description: product.description,
        priceOld: product.priceOld,
        badge: product.badge,
        sku: product.sku,
        weight: product.weight,
        dimensions: product.dimensions,
        material: product.material,
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
    const sorted = rows.slice().sort((a, b) => {
      if (field === "name") return a.name.localeCompare(b.name) * dir;
      const av = field === "price" ? Number(a.price) : Number(a.stockQuantity);
      const bv = field === "price" ? Number(b.price) : Number(b.stockQuantity);
      return (av - bv) * dir;
    });

    // paginated in JS, same as the sort above -- stockQuantity is a computed
    // aggregate, not a real column, so this list is already built in memory
    // before pagination can slice it
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      items: sorted.slice(start, start + limit),
      total: sorted.length,
      page,
      limit,
    };
  },

  async getProductById(productId: number) {
    const [found] = await db
      .select({
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        category: category.name,
        isActive: product.isActive,
        imageUrl: product.imageUrl,
        description: product.description,
        priceOld: product.priceOld,
        badge: product.badge,
        sku: product.sku,
        weight: product.weight,
        dimensions: product.dimensions,
        material: product.material,
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
        isActive: product.isActive,
        imageUrl: product.imageUrl,
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.categoryId))
      .where(eq(product.barcode, barcode));
    // treat inactive products as invisible to the scanner, same as the catalog list
    if (!found || !found.isActive) throw new Error("Product not found");

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
    isActive?: boolean;
    description?: string;
    priceOld?: number;
    badge?: string;
    sku?: string;
    weight?: string;
    dimensions?: string;
    material?: string;
  }) {
    try {
      return await db.transaction(async (trx) => {
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
            isActive: data.isActive ?? true,
            description: data.description,
            priceOld: data.priceOld?.toString(),
            badge: data.badge,
            sku: data.sku,
            weight: data.weight,
            dimensions: data.dimensions,
            material: data.material,
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
    } catch (err) {
      throw translateProductError(err);
    }
  },

  async updateProduct(
    productId: number,
    data: Partial<{
      name: string;
      barcode: string;
      price: number;
      category: string;
      isActive: boolean;
      description: string;
      priceOld: number;
      badge: string;
      sku: string;
      weight: string;
      dimensions: string;
      material: string;
    }>,
  ) {
    try {
      return await db.transaction(async (trx) => {
        const updateValues: Record<string, unknown> = {
          name: data.name,
          barcode: data.barcode,
          price: data.price !== undefined ? data.price.toString() : undefined,
          isActive: data.isActive,
          description: data.description,
          priceOld:
            data.priceOld !== undefined ? data.priceOld.toString() : undefined,
          badge: data.badge,
          sku: data.sku,
          weight: data.weight,
          dimensions: data.dimensions,
          material: data.material,
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
    } catch (err) {
      if ((err as Error).message === "Product not found") throw err;
      throw translateProductError(err);
    }
  },

  async deleteProduct(productId: number) {
    try {
      const [deleted] = await db
        .delete(product)
        .where(eq(product.productId, productId))
        .returning();
      if (!deleted) throw new Error("Product not found");
      return deleted;
    } catch (err) {
      // drizzle-orm wraps the real postgres error in DrizzleQueryError; the
      // actual PostgresError (with .code) lives on .cause, not the top level
      const code = (err as { cause?: { code?: string } }).cause?.code;
      // 23503 = foreign_key_violation — this product has sale history or stock history rows
      if (code === "23503") {
        throw new Error(
          "Cannot delete product — it has sale or stock history. Disable it instead.",
        );
      }
      throw err;
    }
  },

  async updateProductImage(productId: number, imageUrl: string) {
    const [updated] = await db
      .update(product)
      .set({ imageUrl })
      .where(eq(product.productId, productId))
      .returning();
    if (!updated) throw new Error("Product not found");
    return updated;
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
