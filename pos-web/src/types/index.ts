export type Role = "cashier" | "admin";

export interface Profile {
  employeeId: number;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  productId: number;
  name: string;
  barcode: string | null;
  price: string | number;
  category: string | null;
  isActive: boolean;
  stockQuantity: string | number;
}

export type StockReason = "restock" | "damage" | "correction";

export interface SaleItem {
  saleItemId: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  promotionId: number | null;
  discountAmount: string | number;
}

export interface Sale {
  saleId: number;
  createdAt: string;
  totalAmount: string | number;
  paymentMethod: PaymentMethod;
  amountPaid: string | number;
  changeGiven: string | number;
  employeeId: number;
  customerId: number | null;
  items?: SaleItem[];
}

export type PaymentMethod = "cash" | "card" | "e-wallet";

export type DiscountType = "percentage" | "fixed";
export type PromotionScope = "all" | "category" | "product";

export interface Promotion {
  promotionId: number;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string | number;
  scope: PromotionScope;
  categoryId: number | null;
  productId: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Refund {
  refundId: number;
  saleItemId: number;
  saleId: number;
  quantity: number;
  reason: string | null;
  refundedAt: string;
  employeeId: number;
}

export interface Category {
  categoryId: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CartLine {
  product: Product;
  quantity: number;
}
