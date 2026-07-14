import { useEffect, useMemo, useState } from "react";
import { productsApi, salesApi, ApiError } from "../lib/api";
import type { Product, PaymentMethod, Sale } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function money(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

export function ProductsPage() {
  const { profile } = useAuth();
  const cart = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stockQuantity">("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const [barcode, setBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  async function loadProducts() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await productsApi.list({
        search: search || undefined,
        category: category || undefined,
        sortBy,
        order,
        activeOnly: true,
      });
      setProducts(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  async function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    setBarcodeError(null);
    try {
      const product = await productsApi.getByBarcode(barcode.trim());
      cart.addProduct(product);
      setBarcode("");
    } catch (err) {
      setBarcodeError(err instanceof ApiError ? err.message : "Product not found");
    }
  }

  async function handleCheckout() {
    if (!profile) return;
    setCheckoutError(null);
    if (cart.lines.length === 0) {
      setCheckoutError("Cart is empty");
      return;
    }
    const paidNum = Number(amountPaid);
    if (!paidNum || paidNum <= 0) {
      setCheckoutError("Enter an amount paid");
      return;
    }
    setCheckingOut(true);
    try {
      const sale = await salesApi.create({
        items: cart.lines.map((l) => ({
          productId: l.product.productId,
          quantity: l.quantity,
        })),
        employeeId: profile.employeeId,
        paymentMethod,
        amountPaid: paidNum,
        customerId: customerId ? Number(customerId) : undefined,
      });
      setReceipt(sale);
      cart.clear();
      setAmountPaid("");
      setCustomerId("");
      loadProducts();
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <form onSubmit={handleBarcodeSubmit} className="mb-4 flex gap-2">
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or type barcode, then Enter"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Add by barcode
          </button>
        </form>
        {barcodeError && <p className="mb-3 text-sm text-red-600">{barcodeError}</p>}

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadProducts()}
              placeholder="Product name…"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stockQuantity">Stock</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Order</label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as typeof order)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
          <button
            onClick={loadProducts}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Apply
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading products…</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const stock = Number(p.stockQuantity);
            return (
              <div
                key={p.productId}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="mb-2 h-24 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-2 flex h-24 w-full items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                    No image
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category ?? "Uncategorized"}</p>
                <p className="mt-2 text-base font-bold text-gray-900">{money(p.price)}</p>
                <p className={`text-xs ${stock <= 0 ? "text-red-600" : "text-gray-500"}`}>
                  Stock: {stock}
                </p>
                <button
                  disabled={stock <= 0}
                  onClick={() => cart.addProduct(p)}
                  className="mt-2 rounded-md bg-brand-600 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {stock <= 0 ? "Out of stock" : "Add to cart"}
                </button>
              </div>
            );
          })}
          {!loading && products.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">No products found.</p>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Cart</h2>
        {cart.lines.length === 0 ? (
          <p className="text-sm text-gray-500">No items yet.</p>
        ) : (
          <ul className="mb-3 space-y-2">
            {cart.lines.map((l) => (
              <li key={l.product.productId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{l.product.name}</p>
                  <p className="text-xs text-gray-500">{money(l.product.price)} each</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => cart.setQuantity(l.product.productId, Number(e.target.value))}
                  className="w-14 rounded-md border border-gray-300 px-1.5 py-1 text-center text-sm"
                />
                <button
                  onClick={() => cart.removeProduct(l.product.productId)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-3 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold text-gray-900">
          <span>Subtotal</span>
          <span>{money(cart.subtotal)}</span>
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Discounts and final total are calculated by the server at checkout.
        </p>

        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="e-wallet">E-wallet</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Amount paid</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Customer ID (optional)</label>
            <input
              type="number"
              min={1}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {checkoutError && <p className="mt-2 text-sm text-red-600">{checkoutError}</p>}

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="mt-3 w-full rounded-md bg-gray-900 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {checkingOut ? "Processing…" : "Checkout"}
        </button>
      </aside>

      {receipt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Sale complete</h3>
            <dl className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <dt>Sale ID</dt>
                <dd>#{receipt.saleId}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Total</dt>
                <dd>{money(receipt.totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Paid</dt>
                <dd>{money(receipt.amountPaid)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Change</dt>
                <dd>{money(receipt.changeGiven)}</dd>
              </div>
            </dl>
            <button
              onClick={() => setReceipt(null)}
              className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
