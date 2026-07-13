import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { salesApi, productsApi, refundsApi, ApiError } from "../lib/api";
import type { Product, Sale } from "../types";
import { useAuth } from "../context/AuthContext";

function money(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

export function SaleDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [refundLine, setRefundLine] = useState<number | null>(null);
  const [refundQty, setRefundQty] = useState("1");
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [saleData, productList] = await Promise.all([
        salesApi.get(Number(id)),
        productsApi.list(),
      ]);
      setSale(saleData);
      setProducts(Object.fromEntries(productList.map((p) => [p.productId, p])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load sale");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitRefund(saleItemId: number) {
    if (!profile) return;
    setRefundError(null);
    setRefundMessage(null);
    const qty = Number(refundQty);
    if (!qty || qty <= 0) {
      setRefundError("Enter a valid quantity");
      return;
    }
    if (!refundReason.trim()) {
      setRefundError("A reason is required");
      return;
    }
    try {
      await refundsApi.create({
        saleItemId,
        quantity: qty,
        reason: refundReason.trim(),
        employeeId: profile.employeeId,
      });
      setRefundMessage("Refund recorded.");
      setRefundLine(null);
      setRefundQty("1");
      setRefundReason("");
    } catch (err) {
      setRefundError(err instanceof ApiError ? err.message : "Refund failed");
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!sale) return null;

  return (
    <div>
      <Link to="/sales" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Back to sales
      </Link>
      <h1 className="mb-1 text-lg font-bold text-gray-900">Sale #{sale.saleId}</h1>
      <p className="mb-4 text-sm text-gray-500">{new Date(sale.createdAt).toLocaleString()}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Payment</p>
          <p className="font-medium text-gray-900">{sale.paymentMethod}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-medium text-gray-900">{money(sale.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Paid</p>
          <p className="font-medium text-gray-900">{money(sale.amountPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Change</p>
          <p className="font-medium text-gray-900">{money(sale.changeGiven)}</p>
        </div>
      </div>

      {refundMessage && <p className="mb-3 text-sm text-green-600">{refundMessage}</p>}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Unit price</th>
              <th className="px-4 py-2">Discount</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(sale.items ?? []).map((item) => (
              <Fragment key={item.saleItemId}>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">
                    {products[item.productId]?.name ?? `Product #${item.productId}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-gray-600">{money(item.unitPrice)}</td>
                  <td className="px-4 py-2 text-gray-600">{money(item.discountAmount)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() =>
                        setRefundLine(refundLine === item.saleItemId ? null : item.saleItemId)
                      }
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      {refundLine === item.saleItemId ? "Cancel" : "Refund"}
                    </button>
                  </td>
                </tr>
                {refundLine === item.saleItemId && (
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={refundQty}
                            onChange={(e) => setRefundQty(e.target.value)}
                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Reason
                          </label>
                          <input
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => submitRefund(item.saleItemId)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Confirm refund
                        </button>
                      </div>
                      {refundError && <p className="mt-2 text-sm text-red-600">{refundError}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
