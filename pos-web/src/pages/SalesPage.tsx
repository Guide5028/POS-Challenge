import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { salesApi, ApiError } from "../lib/api";
import type { Sale } from "../types";

function money(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    salesApi
      .list()
      .then(setSales)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load sales"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Sales history</h1>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Sale</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Change</th>
                <th className="px-4 py-2">Employee</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.saleId} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">#{s.saleId}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{s.paymentMethod}</td>
                  <td className="px-4 py-2 text-gray-900">{money(s.totalAmount)}</td>
                  <td className="px-4 py-2 text-gray-600">{money(s.changeGiven)}</td>
                  <td className="px-4 py-2 text-gray-600">{s.employeeId}</td>
                  <td className="px-4 py-2">
                    <Link to={`/sales/${s.saleId}`} className="text-brand-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No sales yet.
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
