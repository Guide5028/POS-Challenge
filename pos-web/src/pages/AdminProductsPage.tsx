import { useEffect, useState, type FormEvent } from "react";
import { productsApi, categoriesApi, ApiError } from "../lib/api";
import type { Category, Product, StockReason } from "../types";

function money(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

const emptyCreate = { name: "", barcode: "", price: "", stockQuantity: "0", costPrice: "", category: "" };

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", barcode: "", price: "", category: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const [stockId, setStockId] = useState<number | null>(null);
  const [stockChange, setStockChange] = useState("");
  const [stockReason, setStockReason] = useState<StockReason>("restock");
  const [stockCost, setStockCost] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, categoryList] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(true),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.name.trim() || !createForm.price) {
      setCreateError("Name and price are required");
      return;
    }
    try {
      await productsApi.create({
        name: createForm.name.trim(),
        barcode: createForm.barcode.trim() || undefined,
        price: Number(createForm.price),
        stockQuantity: createForm.stockQuantity ? Number(createForm.stockQuantity) : 0,
        costPrice: createForm.costPrice ? Number(createForm.costPrice) : undefined,
        category: createForm.category.trim() || undefined,
      });
      setCreateForm(emptyCreate);
      load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create product");
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.productId);
    setEditError(null);
    setEditForm({
      name: p.name,
      barcode: p.barcode ?? "",
      price: String(p.price),
      category: p.category ?? "",
    });
  }

  async function saveEdit(id: number) {
    setEditError(null);
    try {
      await productsApi.update(id, {
        name: editForm.name.trim() || undefined,
        barcode: editForm.barcode.trim() || undefined,
        price: editForm.price ? Number(editForm.price) : undefined,
        category: editForm.category.trim() || undefined,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to update product");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.remove(id);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete product");
    }
  }

  async function handleImageUpload(productId: number, file: File | undefined) {
    if (!file) return;
    setImageError(null);
    setUploadingId(productId);
    try {
      await productsApi.uploadImage(productId, file);
      load();
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleActive(p: Product) {
    try {
      await productsApi.update(p.productId, { isActive: !p.isActive });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update product");
    }
  }

  async function submitStock(id: number) {
    setStockError(null);
    const amount = Number(stockChange);
    if (!amount) {
      setStockError("Enter a non-zero amount");
      return;
    }
    try {
      await productsApi.updateStock(
        id,
        amount,
        stockReason,
        stockReason === "restock" && stockCost ? Number(stockCost) : undefined,
      );
      setStockId(null);
      setStockChange("");
      setStockCost("");
      load();
    } catch (err) {
      setStockError(err instanceof ApiError ? err.message : "Failed to adjust stock");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Products</h1>

      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
          <input
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="w-40 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Barcode</label>
          <input
            value={createForm.barcode}
            onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })}
            className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Price</label>
          <input
            type="number"
            step="0.01"
            value={createForm.price}
            onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Initial stock</label>
          <input
            type="number"
            value={createForm.stockQuantity}
            onChange={(e) => setCreateForm({ ...createForm, stockQuantity: e.target.value })}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Cost price</label>
          <input
            type="number"
            step="0.01"
            value={createForm.costPrice}
            onChange={(e) => setCreateForm({ ...createForm, costPrice: e.target.value })}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
          <select
            value={createForm.category}
            onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add product
        </button>
        {createError && <p className="w-full text-sm text-red-600">{createError}</p>}
      </form>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {imageError && <p className="mb-2 text-sm text-red-600">{imageError}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Image</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Barcode</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-10 w-10 rounded-md border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-dashed border-gray-300" />
                    )}
                    <label
                      htmlFor={`image-upload-${p.productId}`}
                      className="mt-1 block cursor-pointer text-xs text-brand-600 hover:underline"
                    >
                      {uploadingId === p.productId ? "Uploading…" : "Upload"}
                    </label>
                    <input
                      id={`image-upload-${p.productId}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageUpload(p.productId, e.target.files?.[0])}
                    />
                  </td>
                  {editingId === p.productId ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.barcode}
                          onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">— none —</option>
                          {categories.map((c) => (
                            <option key={c.categoryId} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-500">{Number(p.stockQuantity)}</td>
                      <td className="px-4 py-2 text-gray-500">{p.isActive ? "Active" : "Inactive"}</td>
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          onClick={() => saveEdit(p.productId)}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-medium text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                        {editError && <p className="text-xs text-red-600">{editError}</p>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-2 text-gray-600">{p.barcode ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600">{p.category ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-900">{money(p.price)}</td>
                      <td className="px-4 py-2 text-gray-600">{Number(p.stockQuantity)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setStockId(stockId === p.productId ? null : p.productId)}
                          className="text-xs font-medium text-gray-700 hover:underline"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => handleDelete(p.productId)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {stockId !== null &&
                products.some((p) => p.productId === stockId) && (
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Change amount (+/-)
                          </label>
                          <input
                            type="number"
                            value={stockChange}
                            onChange={(e) => setStockChange(e.target.value)}
                            className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">Reason</label>
                          <select
                            value={stockReason}
                            onChange={(e) => setStockReason(e.target.value as StockReason)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="restock">Restock</option>
                            <option value="damage">Damage</option>
                            <option value="correction">Correction</option>
                          </select>
                        </div>
                        {stockReason === "restock" && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Cost price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={stockCost}
                              onChange={(e) => setStockCost(e.target.value)}
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => submitStock(stockId)}
                          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                        >
                          Apply
                        </button>
                        {stockError && <p className="text-sm text-red-600">{stockError}</p>}
                      </div>
                    </td>
                  </tr>
                )}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
