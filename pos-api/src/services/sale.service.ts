import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/client";
import { sale } from "../models/sale.model";
import { saleItem } from "../models/saleItem.model";
import { stockHistory } from "../models/stockHistory.model";
import { product } from "../models/product.model";
import { employee } from "../models/employee.model";
import { promotionService, computeDiscountAmount } from "./promotion.service";

type SaleItemInput = { productId: number; quantity: number };

export const saleService = {
  async createSale(data: {
    items: SaleItemInput[];
    employeeId: number;
    paymentMethod: string;
    amountPaid: number;
    customerId?: number;
  }) {
    return db.transaction(async (trx) => {
      const [employeeRow] = await trx
        .select()
        .from(employee)
        .where(eq(employee.employeeId, data.employeeId));
      if (!employeeRow) throw new Error("Employee not found");
      if (!employeeRow.profileComplete) {
        throw new Error(
          "Please confirm your name in your profile before making a sale",
        );
      }

      // check each product exists, has enough stock, and if a promo applies
      const lineItems: {
        productRow: typeof product.$inferSelect;
        quantity: number;
        unitPrice: number;
        promotionId: number | null;
        discountAmount: number;
      }[] = [];
      for (const item of data.items) {
        const [productRow] = await trx
          .select()
          .from(product)
          .where(eq(product.productId, item.productId));
        if (!productRow) throw new Error(`Product ${item.productId} not found`);
        if (!productRow.isActive) {
          throw new Error(`"${productRow.name}" is not available for sale`);
        }

        const [{ currentStock }] = await trx
          .select({
            currentStock: sql<number>`coalesce(sum(${stockHistory.changeAmount}), 0)`,
          })
          .from(stockHistory)
          .where(eq(stockHistory.productId, item.productId));

        if (Number(currentStock) < item.quantity) {
          throw new Error(
            `Not enough stock for "${productRow.name}" (have ${currentStock}, need ${item.quantity})`,
          );
        }

        const unitPrice = Number(productRow.price);
        const lineSubtotal = unitPrice * item.quantity;

        // discount is decided here server-side — the client never sends one
        const bestPromo = await promotionService.getBestPromotionForProduct(
          trx,
          productRow.productId,
          productRow.categoryId,
        );
        const discountAmount = bestPromo
          ? computeDiscountAmount(bestPromo, lineSubtotal)
          : 0;

        lineItems.push({
          productRow,
          quantity: item.quantity,
          unitPrice,
          promotionId: bestPromo ? bestPromo.promotionId : null,
          discountAmount,
        });
      }

      const totalAmount = lineItems.reduce(
        (sum, li) => sum + li.unitPrice * li.quantity - li.discountAmount,
        0,
      );
      if (data.amountPaid < totalAmount) {
        throw new Error(
          `Amount paid (${data.amountPaid}) is less than total (${totalAmount})`,
        );
      }

      const [newSale] = await trx
        .insert(sale)
        .values({
          employeeId: data.employeeId,
          customerId: data.customerId,
          paymentMethod: data.paymentMethod,
          totalAmount: totalAmount.toString(),
          amountPaid: data.amountPaid.toString(),
          changeGiven: (data.amountPaid - totalAmount).toString(),
        })
        .returning();

      for (const li of lineItems) {
        await trx.insert(saleItem).values({
          saleId: newSale.saleId,
          productId: li.productRow.productId,
          quantity: li.quantity,
          unitPrice: li.unitPrice.toString(),
          promotionId: li.promotionId ?? undefined,
          discountAmount: li.discountAmount.toString(),
        });

        // stock goes down by adding a new ledger row, not editing a column
        await trx.insert(stockHistory).values({
          productId: li.productRow.productId,
          changeAmount: -li.quantity,
          reason: "sale",
        });
      }

      return newSale;
    });
  },

  async getAllSales() {
    return db.select().from(sale).orderBy(desc(sale.createdAt));
  },

  async getSaleById(saleId: number) {
    const [found] = await db.select().from(sale).where(eq(sale.saleId, saleId));
    if (!found) throw new Error("Sale not found");

    const items = await db
      .select()
      .from(saleItem)
      .where(eq(saleItem.saleId, saleId));
    return { ...found, items };
  },
};
