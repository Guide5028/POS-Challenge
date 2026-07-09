import { eq, and, lte, gte, or, desc } from "drizzle-orm";
import { db, DbOrTx } from "../db/client";
import { promotion } from "../models/promotion.model";

type CreatePromotionInput = {
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  scope: "all" | "category" | "product";
  categoryId?: number;
  productId?: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
};

// turns "20% off" or "$5 off" into an actual dollar amount for one line
export function computeDiscountAmount(
  promo: { discountType: string; discountValue: string | number },
  lineSubtotal: number,
): number {
  const value = Number(promo.discountValue);
  if (promo.discountType === "percentage") {
    return Math.round(lineSubtotal * (value / 100) * 100) / 100;
  }
  // cap fixed discounts at the line total so price can't go negative
  return Math.min(value, lineSubtotal);
}

export const promotionService = {
  async getAllPromotions(activeOnly = false) {
    const rows = await db.select().from(promotion).orderBy(desc(promotion.createdAt));
    if (!activeOnly) return rows;

    const now = new Date();
    return rows.filter(
      (p) => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now,
    );
  },

  async getPromotionById(promotionId: number) {
    const [found] = await db
      .select()
      .from(promotion)
      .where(eq(promotion.promotionId, promotionId));
    if (!found) throw new Error("Promotion not found");
    return found;
  },

  async createPromotion(data: CreatePromotionInput) {
    if (data.scope === "category" && !data.categoryId) {
      throw new Error("scope 'category' requires a categoryId");
    }
    if (data.scope === "product" && !data.productId) {
      throw new Error("scope 'product' requires a productId");
    }
    if (data.endDate <= data.startDate) {
      throw new Error("endDate must be after startDate");
    }

    const [created] = await db
      .insert(promotion)
      .values({
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
        scope: data.scope,
        categoryId: data.scope === "category" ? data.categoryId : undefined,
        productId: data.scope === "product" ? data.productId : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
      })
      .returning();
    return created;
  },

  async updatePromotion(promotionId: number, data: Partial<CreatePromotionInput>) {
    const updateValues: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue !== undefined ? data.discountValue.toString() : undefined,
      scope: data.scope,
      categoryId: data.categoryId,
      productId: data.productId,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
    };
    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k],
    );

    const [updated] = await db
      .update(promotion)
      .set(updateValues)
      .where(eq(promotion.promotionId, promotionId))
      .returning();
    if (!updated) throw new Error("Promotion not found");
    return updated;
  },

  async deletePromotion(promotionId: number) {
    const [deleted] = await db
      .delete(promotion)
      .where(eq(promotion.promotionId, promotionId))
      .returning();
    if (!deleted) throw new Error("Promotion not found");
    return deleted;
  },

  // used by sale.service.ts during checkout, not exposed as its own route
  async getBestPromotionForProduct(
    executor: DbOrTx,
    productId: number,
    categoryId: number | null,
  ) {
    const now = new Date();

    const scopeMatch = categoryId
      ? or(
          eq(promotion.scope, "all"),
          and(eq(promotion.scope, "category"), eq(promotion.categoryId, categoryId)),
          and(eq(promotion.scope, "product"), eq(promotion.productId, productId)),
        )
      : or(
          eq(promotion.scope, "all"),
          and(eq(promotion.scope, "product"), eq(promotion.productId, productId)),
        );

    const candidates = await executor
      .select()
      .from(promotion)
      .where(
        and(
          eq(promotion.isActive, true),
          lte(promotion.startDate, now),
          gte(promotion.endDate, now),
          scopeMatch,
        ),
      );

    if (candidates.length === 0) return null;

    // most specific scope wins (product > category > all); ties go to the
    // bigger discountValue, which isn't perfectly fair across % vs $ but is
    // good enough here
    const specificity: Record<string, number> = { product: 3, category: 2, all: 1 };
    candidates.sort((a, b) => {
      const specDiff = specificity[b.scope] - specificity[a.scope];
      if (specDiff !== 0) return specDiff;
      return Number(b.discountValue) - Number(a.discountValue);
    });

    return candidates[0];
  },
};
