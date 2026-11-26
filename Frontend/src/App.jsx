import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ToastProvider } from './app/ToastContext';
import { MarketplaceDataProvider } from './app/MarketplaceDataContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import MarketplacePage from './pages/MarketplacePage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import SavedPage from './pages/SavedPage';
import MyListingsPage from './pages/MyListingsPage';
import ProfilePage from './pages/ProfilePage';

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <StartupScreen />;
  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : children;
}

function PrivateRoutes() {
  const { user, ready } = useAuth();
  if (!ready) return <StartupScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function StartupScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="flex items-center gap-3 text-lg font-semibold">
        <span className="size-3 animate-pulse rounded-full bg-amber-400" />
        Motrly
      </div>
    </main>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* صفحهٔ ورود فقط برای کاربران خارج‌شده باز است. */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      {/* صفحه‌های حساب کاربری پس از ورود و در قاب مشترک نمایش داده می‌شوند. */}
      <Route element={<PrivateRoutes />}>
        <Route element={<AppLayout />}>
          {/* بازار و فهرست آگهی‌ها */}
          <Route index element={<MarketplacePage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="my-listings" element={<MyListingsPage />} />
          {/* پیام‌ها و تنظیمات حساب */}
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* پنل مدیریت فقط برای نقش مدیر قابل دسترسی است. */}
          <Route
            path="admin"
            element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
          />
        </Route>
      </Route>
      {/* مسیرهای ناشناخته به صفحهٔ مناسب وضعیت ورود برمی‌گردند. */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MarketplaceDataProvider>
          <AppRoutes />
        </MarketplaceDataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
