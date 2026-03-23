import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/Customers/CustomerList';
import { CustomerDetail } from './pages/Customers/CustomerDetail';
import { CustomerForm } from './pages/Customers/CustomerForm';
import { Subscriptions } from './pages/Subscriptions/Subscriptions';
import { RequestList } from './pages/Requests/RequestList';
import { RequestDetail } from './pages/Requests/RequestDetail';
import { ReminderCentre } from './pages/Reminders/ReminderCentre';
import { RenewalHistoryPage } from './pages/History/RenewalHistory';
import { Reports } from './pages/Reports/Reports';
import { SettingsPage } from './pages/Settings/Settings';
import { USDTPurchases } from './pages/Finance/USDTPurchases';
import { InventoryManager } from './pages/Inventory/InventoryManager';
import AdminDashboard from '../../components/AdminDashboard';
import ManageTestimonials from '../../components/ManageTestimonials';
import { ToastProvider } from './components/ui/Toast';
import { ProductList } from './pages/Products/ProductList';
import { ProductForm } from './pages/Products/ProductForm';

interface AdminRoutesProps {
  onLogout: () => void;
}

export const AdminRoutes: React.FC<AdminRoutesProps> = ({ onLogout }) => {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/:id/edit" element={<CustomerForm />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="requests" element={<RequestList />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="reminders" element={<ReminderCentre />} />
          <Route path="history" element={<RenewalHistoryPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="finance/usdt" element={<USDTPurchases />} />
          <Route path="inventory" element={<InventoryManager />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Legacy integrated features */}
          <Route path="posts" element={<AdminDashboard onLogout={onLogout} />} />
          <Route path="testimonials" element={<div className="p-4 md:p-6 w-full max-w-7xl mx-auto"><ManageTestimonials /></div>} />
        </Route>
      </Routes>
    </ToastProvider>
  );
};
