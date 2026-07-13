import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;

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
                  <NavLink to="/admin/products" className={linkClass}>
                    Products
                  </NavLink>
                  <NavLink to="/admin/promotions" className={linkClass}>
                    Promotions
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
