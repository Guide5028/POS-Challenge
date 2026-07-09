import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { refund } from "../models/refund.model";
import { saleItem } from "../models/saleItem.model";
import { stockHistory } from "../models/stockHistory.model";

export const refundService = {
  async createRefund(
    saleItemId: number,
    quantity: number,
    reason: string,
    employeeId: number,
  ) {
    return db.transaction(async (trx) => {
      const [item] = await trx
        .select()
        .from(saleItem)
        .where(eq(saleItem.saleItemId, saleItemId));
      if (!item) throw new Error("Sale item not found");

      const [{ alreadyRefunded }] = await trx
        .select({
          alreadyRefunded: sql<number>`coalesce(sum(${refund.quantity}), 0)`,
        })
        .from(refund)
        .where(eq(refund.saleItemId, saleItemId));

      const remaining = item.quantity - Number(alreadyRefunded);
      if (quantity > remaining) {
        throw new Error(
          `Cannot refund ${quantity} — only ${remaining} left on this line item`,
        );
      }

      const [createdRefund] = await trx
        .insert(refund)
        .values({ saleItemId, quantity, reason, employeeId })
        .returning();

      // put the stock back by logging a positive change
      await trx.insert(stockHistory).values({
        productId: item.productId,
        changeAmount: quantity,
        reason: "refund",
      });

      return createdRefund;
    });
  },
};
