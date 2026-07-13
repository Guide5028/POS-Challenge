import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
