import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CarFront, Compass, Heart, LogOut, Menu, MessageCircle, Moon, Plus, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useToast } from '../app/ToastContext';
import CreateListingModal from '../features/marketplace/CreateListingModal';
import Avatar from '../components/Avatar';
import { getUnreadMessages } from '../features/messages/messagesApi';

// Layout
const navItems = [
  ['/', 'Discover', Compass],
  ['/saved', 'Saved', Heart],
  ['/my-listings', 'My listings', CarFront],
  ['/messages', 'Messages', MessageCircle],
];

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('motrly_theme') || 'light');
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const knownUnreadIds = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('motrly_theme', theme);
  }, [theme]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // هر چند ثانیه اعلان‌های پیام را می‌گیرد و پیام تازه را یک‌بار خبر می‌دهد
  useEffect(() => {
    let active = true;
    const refreshUnread = async () => {
      try {
        const data = await getUnreadMessages();
        if (!active) return;
        const incoming = data.messages || [];
        if (knownUnreadIds.current) {
          const fresh = incoming.find(({ id }) => !knownUnreadIds.current.has(id));
          if (fresh) toast(t('New message from {{name}}', { name: fresh.sender_name }));
        }
        knownUnreadIds.current = new Set(incoming.map(({ id }) => id));
        setUnreadMessages(incoming);
        setUnreadCount(data.unreadCount || 0);
      } catch {
      }
    };
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.id, t, toast]);

  const logout = () => {
    signOut();
    navigate('/login');
  };
  // اعلان تازه را به گفتگوی همان پیام می‌برد
  const openNotifications = () =>
    unreadMessages.length
      ? navigate('/messages', { state: { messageId: unreadMessages[0].id } })
      : toast(t('You are all caught up'));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:h-[72px] sm:gap-6 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3" aria-label="Motrly home">
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-slate-950/15">
              <img src="/motrly-mark.svg" alt="" className="size-6" />
            </span>
            <span className="text-lg font-black tracking-tight sm:text-xl">
              motrly<span className="text-amber-500">.</span>
              <small className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 sm:block">
                {t('VEHICLE MARKETPLACE')}
              </small>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(([to, title]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white'}`
                }
              >
                {t(title)}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`
                }
              >
                <ShieldCheck size={15} />
                {t('Admin')}
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="hidden items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 sm:flex dark:border-slate-800 dark:text-slate-200">
              <span className="sr-only">{t('Language')}</span>
              <select
                value={i18n.resolvedLanguage || 'en'}
                onChange={(event) => i18n.changeLanguage(event.target.value)}
                className="max-w-24 bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
              >
                <option value="en" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">English</option>
                <option value="fa" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">دری</option>
                <option value="ps" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">پښتو</option>
              </select>
            </label>
            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label={t(theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={openNotifications}
              className="relative hidden size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 sm:grid dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label={t('Notifications')}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -end-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-semibold sm:flex dark:border-slate-800"
            >
              <Avatar
                src={user?.avatar_url}
                name={user?.name}
                className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-amber-100 text-sm font-black text-amber-900 dark:bg-amber-300/15 dark:text-amber-200"
              />
              <span className="max-w-24 truncate">{user?.name?.split(' ')[0] || t('Account')}</span>
            </button>
            <button
              onClick={() => setPostOpen(true)}
              className="hidden items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-300 sm:flex"
            >
              <Plus size={17} />
              {t('Sell a vehicle')}
            </button>
            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 lg:hidden dark:border-slate-800"
              aria-label={t(mobileOpen ? 'Close menu' : 'Open menu')}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
              {navItems.map(([to, title]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-500'}`
                  }
                >
                  {t(title)}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-amber-700 dark:text-amber-300"
                >
                  {t('Admin')}
                </NavLink>
              )}
              <button
                onClick={openNotifications}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                <Bell size={16} />
                {t('Notifications')}
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setPostOpen(true)}
                className="rounded-xl bg-amber-400 px-3 py-3 text-sm font-bold text-slate-950"
              >
                {t('Sell a vehicle')}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500"
              >
                <LogOut size={15} />
                {t('Sign out')}
              </button>
              <label className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-800 dark:text-slate-100">
                <span>{t('Language')}</span>
                <select
                  value={i18n.resolvedLanguage || 'en'}
                  onChange={(event) => i18n.changeLanguage(event.target.value)}
                  className="bg-transparent font-semibold text-slate-900 dark:text-white"
                >
                  <option value="en" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">English</option>
                  <option value="fa" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">دری</option>
                  <option value="ps" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">پښتو</option>
                </select>
              </label>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold"
              >
                <UserRound size={15} />
                {t('Edit your profile')}
              </button>
            </nav>
          </div>
        )}
      </header>
      <nav
        aria-label={t('Primary navigation')}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200/90 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-20px_rgba(15,23,42,.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        {navItems.map(([to, title, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition ${isActive ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`grid size-8 place-items-center rounded-xl ${isActive ? 'bg-amber-100 dark:bg-amber-300/15' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span className="max-w-full truncate">{t(title)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ openPost: () => setPostOpen(true), toast }} />
      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 Motrly · {t('Built for Afghanistan')}</span>
          <div className="flex gap-4">
            <button onClick={logout} className="hover:text-slate-900 dark:hover:text-white">
              {t('Sign out')}
            </button>
            <span>{t('Terms & privacy')}</span>
          </div>
        </div>
      </footer>
      {postOpen && <CreateListingModal onClose={() => setPostOpen(false)} toast={toast} />}
    </div>
  );
}
