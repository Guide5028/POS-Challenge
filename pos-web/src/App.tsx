import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SalesPage } from "./pages/SalesPage";
import { SaleDetailPage } from "./pages/SaleDetailPage";
import { AdminProductsPage } from "./pages/AdminProductsPage";
import { AdminPromotionsPage } from "./pages/AdminPromotionsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<ProductsPage />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/:id" element={<SaleDetailPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
