import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/client";
import { refund } from "../models/refund.model";
import { saleItem } from "../models/saleItem.model";
import { stockHistory } from "../models/stockHistory.model";
import { product } from "../models/product.model";
import { employee } from "../models/employee.model";

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
        .values({ saleItemId, saleId: item.saleId, quantity, reason, employeeId })
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

  async getAllRefunds() {
    return db
      .select({
        refundId: refund.refundId,
        saleItemId: refund.saleItemId,
        saleId: refund.saleId,
        quantity: refund.quantity,
        reason: refund.reason,
        refundedAt: refund.refundedAt,
        employeeId: refund.employeeId,
        employeeName: employee.name,
        productId: saleItem.productId,
        productName: product.name,
      })
      .from(refund)
      .leftJoin(saleItem, eq(refund.saleItemId, saleItem.saleItemId))
      .leftJoin(product, eq(saleItem.productId, product.productId))
      .leftJoin(employee, eq(refund.employeeId, employee.employeeId))
      .orderBy(desc(refund.refundedAt));
  },
};
