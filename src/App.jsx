import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store.js';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import POSPage from './pages/pos/POSPage.jsx';
import KitchenPage from './pages/kitchen/KitchenPage.jsx';
import OrdersPage from './pages/orders/OrdersPage.jsx';
import MenuPage from './pages/menu/MenuPage.jsx';
import TablesPage from './pages/tables/TablesPage.jsx';
import InventoryPage from './pages/inventory/InventoryPage.jsx';
import CustomersPage from './pages/customers/CustomersPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="kitchen" element={<KitchenPage />} />
          <Route path="orders"    element={<OrdersPage />} />
          <Route path="menu"      element={<MenuPage />} />
          <Route path="tables"    element={<TablesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
