import { useEffect, useState } from "react";
import { employeesApi, ApiError } from "../lib/api";
import type { Employee, Role } from "../types";
import { useAuth } from "../context/AuthContext";

export function AdminEmployeesPage() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEmployees(await employeesApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(e: Employee) {
    try {
      await employeesApi.update(e.employeeId, { isActive: !e.isActive });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update employee");
    }
  }

  async function changeRole(e: Employee, role: Role) {
    try {
      await employeesApi.update(e.employeeId, { role });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update employee");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Employees</h1>
      <p className="mb-4 text-sm text-gray-500">
        New Google/Facebook sign-ups land here as inactive until approved.
      </p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Profile</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const isSelf = e.employeeId === profile?.employeeId;
                return (
                  <tr key={e.employeeId} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-900">{e.name}</td>
                    <td className="px-4 py-2 text-gray-600">{e.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={e.role}
                        disabled={isSelf}
                        onChange={(ev) => changeRole(e, ev.target.value as Role)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="cashier">Cashier</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {e.profileComplete ? "Complete" : "Incomplete"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleActive(e)}
                        disabled={isSelf}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                          e.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {e.isActive ? "Active" : "Pending / Inactive"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No employees yet.
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
