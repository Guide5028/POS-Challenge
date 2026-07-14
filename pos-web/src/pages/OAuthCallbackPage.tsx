import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const status = searchParams.get("status");

    if (status === "pending") return; // render the pending message below
    if (status === "error" || !accessToken || !refreshToken) {
      setError("Something went wrong signing you in. Please try again.");
      return;
    }

    loginWithTokens(accessToken, refreshToken)
      .then(() => navigate("/"))
      .catch(() => setError("Something went wrong signing you in. Please try again."));
  }, [searchParams, loginWithTokens, navigate]);

  const status = searchParams.get("status");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "pending" ? (
          <>
            <h1 className="mb-2 text-lg font-bold text-gray-900">Account created</h1>
            <p className="text-sm text-gray-600">
              Your account was created but needs admin approval before you can sign in.
              Ask an admin to activate your account, then try again.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="mb-2 text-lg font-bold text-gray-900">Sign-in failed</h1>
            <p className="mb-4 text-sm text-red-600">{error}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Signing you in…</p>
        )}
        <Link to="/login" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
