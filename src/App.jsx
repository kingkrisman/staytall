import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import StoreGate from './pages/Storefront';
import AuthPage from './pages/AuthPage';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import { Toast } from './components/Extras';

// The owner's tools ship as their own chunk — shoppers never download them.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Products = lazy(() => import('./pages/admin/Products'));
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Discounts = lazy(() => import('./pages/admin/Discounts'));
const StorefrontSettings = lazy(() => import('./pages/admin/StorefrontSettings'));
const Settings = lazy(() => import('./pages/admin/Settings'));

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="route-loading" />}>
        <Routes>
          <Route path="/" element={<StoreGate />} />
          <Route path="/signin" element={<AuthPage mode="signin" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<Customers />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="storefront" element={<StorefrontSettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toast />
    </>
  );
}
