import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { refundsApi, ApiError } from "../lib/api";
import type { Refund } from "../types";

export function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refundsApi
      .list()
      .then(setRefunds)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load refunds"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Refund history</h1>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Refund</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">By</th>
                <th className="px-4 py-2">Sale</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.refundId} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">#{r.refundId}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(r.refundedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {r.productName ?? `Product #${r.productId}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.quantity}</td>
                  <td className="px-4 py-2 text-gray-600">{r.reason ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.employeeName ?? `Employee #${r.employeeId}`}
                  </td>
                  <td className="px-4 py-2">
                    <Link to={`/sales/${r.saleId}`} className="text-brand-600 hover:underline">
                      #{r.saleId}
                    </Link>
                  </td>
                </tr>
              ))}
              {refunds.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No refunds yet.
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
