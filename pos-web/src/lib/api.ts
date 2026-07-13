import { tokens } from "./tokens";
import type {
  Category,
  Product,
  Profile,
  Promotion,
  Refund,
  Sale,
  StockReason,
  PaymentMethod,
  DiscountType,
  PromotionScope,
} from "../types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; message: string };

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const refresh = tokens.refresh;
  if (!refresh) throw new ApiError(401, "Not logged in");

  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  const body = (await res.json()) as Envelope<{ accessToken: string }>;
  if (!res.ok || !body.success) {
    tokens.clear();
    throw new ApiError(401, "Session expired — please log in again");
  }
  tokens.setAccess(body.data.accessToken);
  return body.data.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const access = tokens.access;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401 && retry && tokens.refresh && !path.startsWith("/auth/")) {
    refreshPromise ??= doRefresh().finally(() => {
      refreshPromise = null;
    });
    await refreshPromise;
    return request<T>(path, options, false);
  }

  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    const message = !body.success ? body.message : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body.data;
}

const get = <T>(path: string) => request<T>(path, { method: "GET" });
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  profile: Profile;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResult>("/auth/login", { email, password }),
  register: (email: string, password: string, name: string) =>
    post<Profile>("/auth/register", { email, password, name }),
  logout: () => post<{ message: string }>("/auth/logout"),
  profile: () => get<Profile>("/auth/profile"),
};

export interface ListProductsParams {
  category?: string;
  search?: string;
  sortBy?: "name" | "price" | "stockQuantity";
  order?: "asc" | "desc";
  activeOnly?: boolean;
}

function toQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export interface CreateProductInput {
  name: string;
  barcode?: string;
  price: number;
  stockQuantity?: number;
  costPrice?: number;
  category?: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  barcode?: string;
  price?: number;
  category?: string;
  isActive?: boolean;
}

export const productsApi = {
  list: ({ activeOnly, ...params }: ListProductsParams = {}) =>
    get<Product[]>(
      `/products${toQuery({ ...params, activeOnly: activeOnly ? "true" : undefined })}`,
    ),
  get: (id: number) => get<Product>(`/products/${id}`),
  getByBarcode: (barcode: string) =>
    get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`),
  create: (data: CreateProductInput) => post<Product>("/products", data),
  update: (id: number, data: UpdateProductInput) =>
    put<Product>(`/products/${id}`, data),
  remove: (id: number) => del<{ message: string }>(`/products/${id}`),
  updateStock: (
    id: number,
    changeAmount: number,
    reason: StockReason,
    costPrice?: number,
  ) =>
    patch<Product>(`/products/${id}/stock`, { changeAmount, reason, costPrice }),
};

export interface CreateSaleInput {
  items: { productId: number; quantity: number }[];
  employeeId: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  customerId?: number;
}

export const salesApi = {
  create: (data: CreateSaleInput) => post<Sale>("/sales", data),
  list: () => get<Sale[]>("/sales"),
  get: (id: number) => get<Sale>(`/sales/${id}`),
};

export interface CreatePromotionInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  scope: PromotionScope;
  categoryId?: number;
  productId?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export const promotionsApi = {
  list: (activeOnly?: boolean) =>
    get<Promotion[]>(`/promotions${activeOnly ? "?activeOnly=true" : ""}`),
  get: (id: number) => get<Promotion>(`/promotions/${id}`),
  create: (data: CreatePromotionInput) => post<Promotion>("/promotions", data),
  update: (id: number, data: Partial<CreatePromotionInput>) =>
    put<Promotion>(`/promotions/${id}`, data),
  remove: (id: number) => del<{ message: string }>(`/promotions/${id}`),
};

export interface CreateCategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const categoriesApi = {
  list: (activeOnly?: boolean) =>
    get<Category[]>(`/categories${activeOnly ? "?activeOnly=true" : ""}`),
  get: (id: number) => get<Category>(`/categories/${id}`),
  create: (data: CreateCategoryInput) => post<Category>("/categories", data),
  update: (id: number, data: Partial<CreateCategoryInput>) =>
    put<Category>(`/categories/${id}`, data),
  remove: (id: number) => del<{ message: string }>(`/categories/${id}`),
};

export const refundsApi = {
  create: (data: {
    saleItemId: number;
    quantity: number;
    reason: string;
    employeeId: number;
  }) => post<Refund>("/refunds", data),
};
