import { useState, type FormEvent } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, ApiError } from "../lib/api";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;

function ProfileCompleteBanner() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile || profile.profileComplete) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile(name.trim());
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm"
      >
        <span className="font-medium text-amber-800">
          Confirm your name before making a sale:
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-amber-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {error && <span className="text-red-600">{error}</span>}
      </form>
    </div>
  );
}

export function Layout() {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">POS</span>
            <nav className="ml-4 flex gap-1">
              <NavLink to="/" end className={linkClass}>
                Checkout
              </NavLink>
              {profile?.role === "admin" && (
                <>
                  <NavLink to="/sales" className={linkClass}>
                    Sales
                  </NavLink>
                  <NavLink to="/refunds" className={linkClass}>
                    Refunds
                  </NavLink>
                  <NavLink to="/admin/products" className={linkClass}>
                    Products
                  </NavLink>
                  <NavLink to="/admin/promotions" className={linkClass}>
                    Promotions
                  </NavLink>
                  <NavLink to="/admin/employees" className={linkClass}>
                    Employees
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {profile?.name} <span className="text-gray-400">({profile?.role})</span>
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <ProfileCompleteBanner />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
