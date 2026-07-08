import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { refund } from "../models/refund.model";
import { saleItem } from "../models/saleItem.model";
import { product } from "../models/product.model";
import { stock } from "../models/stock.model";

export const refundService = {
  async createRefund(saleItemId: number, quantity: number, reason: string, employeeId: number) {
    return db.transaction(async (trx) => {
      const [item] = await trx.select().from(saleItem).where(eq(saleItem.saleItemId, saleItemId));
      if (!item) throw new Error("Sale item not found");

      // Support partial refunds: sum whatever's already been refunded on
      // this line item, so someone can't refund more than was ever sold.
      const [{ alreadyRefunded }] = await trx
        .select({ alreadyRefunded: sql<number>`coalesce(sum(${refund.quantity}), 0)` })
        .from(refund)
        .where(eq(refund.saleItemId, saleItemId));

      const remaining = item.quantity - Number(alreadyRefunded);
      if (quantity > remaining) {
        throw new Error(`Cannot refund ${quantity} — only ${remaining} left on this line item`);
      }

      const [createdRefund] = await trx
        .insert(refund)
        .values({ saleItemId, quantity, reason, employeeId })
        .returning();

      const [productRow] = await trx.select().from(product).where(eq(product.productId, item.productId));
      if (productRow) {
        await trx
          .update(product)
          .set({ stockQuantity: productRow.stockQuantity + quantity })
          .where(eq(product.productId, item.productId));
      }

      // Refunded stock goes back on the shelf — logged with a positive
      // changeAmount so the ledger shows exactly why it went up.
      await trx.insert(stock).values({
        productId: item.productId,
        changeAmount: quantity,
        reason: "refund",
      });

      return createdRefund;
    });
  },
};
