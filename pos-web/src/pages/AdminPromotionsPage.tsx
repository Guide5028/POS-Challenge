import { useEffect, useState, type FormEvent } from "react";
import { promotionsApi, productsApi, ApiError } from "../lib/api";
import type { DiscountType, Product, Promotion, PromotionScope } from "../types";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  name: "",
  description: "",
  discountType: "percentage" as DiscountType,
  discountValue: "",
  scope: "all" as PromotionScope,
  categoryId: "",
  productId: "",
  startDate: "",
  endDate: "",
};

export function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [promos, prods] = await Promise.all([promotionsApi.list(), productsApi.list()]);
      setPromotions(promos);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(p: Promotion) {
    setEditingId(p.promotionId);
    setFormError(null);
    setForm({
      name: p.name,
      description: p.description ?? "",
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      scope: p.scope,
      categoryId: p.categoryId ? String(p.categoryId) : "",
      productId: p.productId ? String(p.productId) : "",
      startDate: toLocalInput(p.startDate),
      endDate: toLocalInput(p.endDate),
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.discountValue || !form.startDate || !form.endDate) {
      setFormError("Name, discount value, and both dates are required");
      return;
    }
    if (form.scope === "category" && !form.categoryId) {
      setFormError("Category ID is required for category-scoped promotions");
      return;
    }
    if (form.scope === "product" && !form.productId) {
      setFormError("Select a product for product-scoped promotions");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      scope: form.scope,
      categoryId: form.scope === "category" ? Number(form.categoryId) : undefined,
      productId: form.scope === "product" ? Number(form.productId) : undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    };

    try {
      if (editingId) {
        await promotionsApi.update(editingId, payload);
      } else {
        await promotionsApi.create(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save promotion");
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      await promotionsApi.update(p.promotionId, { isActive: !p.isActive });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update promotion");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this promotion?")) return;
    try {
      await promotionsApi.remove(id);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete promotion");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Promotions</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-40 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Value</label>
          <input
            type="number"
            step="0.01"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Scope</label>
          <select
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value as PromotionScope })}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="all">All products</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </div>
        {form.scope === "category" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Category ID</label>
            <input
              type="number"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        )}
        {form.scope === "product" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Product</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Start</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">End</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-40 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {editingId ? "Save changes" : "Add promotion"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
        {formError && <p className="w-full text-sm text-red-600">{formError}</p>}
      </form>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Scope</th>
                <th className="px-4 py-2">Window</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.promotionId} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {p.discountType === "percentage" ? `${p.discountValue}%` : `$${p.discountValue}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {p.scope}
                    {p.scope === "category" && p.categoryId ? ` (#${p.categoryId})` : ""}
                    {p.scope === "product" && p.productId ? ` (#${p.productId})` : ""}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
                  </td>
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
                      onClick={() => handleDelete(p.promotionId)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No promotions yet.
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
