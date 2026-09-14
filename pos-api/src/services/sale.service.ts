import { eq, desc, sql, inArray } from "drizzle-orm";
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

  // Eager-loads each sale's line items in one extra query (not one per sale) --
  // the admin dashboard used to call getSaleById per sale to build "Top selling
  // products", which meant N+1 requests (1 + one per order).
  async getAllSales() {
    const sales = await db.select().from(sale).orderBy(desc(sale.createdAt));
    if (sales.length === 0) return [];

    const items = await db
      .select()
      .from(saleItem)
      .where(inArray(saleItem.saleId, sales.map((s) => s.saleId)));

    return sales.map((s) => ({
      ...s,
      items: items.filter((i) => i.saleId === s.saleId),
    }));
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

  // A customer's own order history (My Account page) -- items are joined in eagerly
  // (product name/image) so the frontend doesn't need a second admin-gated call per order.
  async getSalesForCustomer(customerId: number) {
    const sales = await db
      .select()
      .from(sale)
      .where(eq(sale.customerId, customerId))
      .orderBy(desc(sale.createdAt));
    if (sales.length === 0) return [];

    const items = await db
      .select({
        saleId: saleItem.saleId,
        productId: saleItem.productId,
        quantity: saleItem.quantity,
        unitPrice: saleItem.unitPrice,
        discountAmount: saleItem.discountAmount,
        productName: product.name,
        imageUrl: product.imageUrl,
      })
      .from(saleItem)
      .innerJoin(product, eq(saleItem.productId, product.productId))
      .where(inArray(saleItem.saleId, sales.map((s) => s.saleId)));

    return sales.map((s) => ({
      ...s,
      items: items.filter((i) => i.saleId === s.saleId),
    }));
  },
};
