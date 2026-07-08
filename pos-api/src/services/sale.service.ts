import { eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { sale } from "../models/sale.model";
import { saleItem } from "../models/saleItem.model";
import { stock } from "../models/stock.model";
import { product } from "../models/product.model";

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
      // Validate all products exist and have enough stock, and prepare line items for insertion.
      const lineItems: {
        productRow: typeof product.$inferSelect;
        quantity: number;
        unitPrice: number;
      }[] = [];
      for (const item of data.items) {
        const [productRow] = await trx
          .select()
          .from(product)
          .where(eq(product.productId, item.productId));
        if (!productRow) throw new Error(`Product ${item.productId} not found`);
        if (productRow.stockQuantity < item.quantity) {
          throw new Error(
            `Not enough stock for "${productRow.name}" (have ${productRow.stockQuantity}, need ${item.quantity})`,
          );
        }
        lineItems.push({
          productRow,
          quantity: item.quantity,
          unitPrice: Number(productRow.price),
        });
      }

      const totalAmount = lineItems.reduce(
        (sum, li) => sum + li.unitPrice * li.quantity,
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
        });

        // Deduct the sold quantity from stock and log the change in the stock ledger.
        await trx
          .update(product)
          .set({ stockQuantity: li.productRow.stockQuantity - li.quantity })
          .where(eq(product.productId, li.productRow.productId));

        await trx.insert(stock).values({
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
