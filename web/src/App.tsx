import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import FarmerProfilePage from "./pages/FarmerProfilePage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import AddProductPage from "./pages/AddProductPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderSuccessPage />} />
        <Route path="/farmers/:id" element={<FarmerProfilePage />} />
        <Route path="/farmer/:id" element={<FarmerProfilePage />} />
        <Route path="/seller" element={<SellerDashboardPage />} />
        <Route path="/seller/products/new" element={<AddProductPage />} />
        <Route path="/seller/orders" element={<SellerOrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
