/**
 * Layout — app shell.
 *
 * DESIGN_GUIDE §4 topology:
 *   Fixed 240px sidebar  |  64px top bar
 *                        |  ─────────────────────────
 *                        |  Content: max-w-[1280px], centered, px-6 (24px)
 *
 * Sidebar = 3 sibling regions, structurally separate:
 *   <SidebarLogo />       — 64px header, brand only
 *   <SidebarNav />        — flex-1 scrollable, nav links
 *   <SidebarUserFooter /> — pinned bottom, sign-out only
 */

import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import {
  LayoutDashboard,
  Settings,
  FolderTree,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  LogOut,
  CheckCheck,
  History,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard',    path: '/',             icon: LayoutDashboard },
  { name: 'Assets',       path: '/assets',       icon: FolderTree      },
  { name: 'Bookings',     path: '/bookings',     icon: CalendarDays    },
  { name: 'Maintenance',  path: '/maintenance',  icon: Wrench          },
  { name: 'Audits',       path: '/audits',       icon: ClipboardCheck  },
  { name: 'Activity Log', path: '/activity-log', icon: History         },
  { name: 'Org Setup',    path: '/org-setup',    icon: Settings        },
  { name: 'Reports',      path: '/reports',      icon: BarChart3       },
];

/* ── SidebarLogo ────────────────────────────────────────────────────────
   Fixed 64px height. Brand mark only. Zero hover/active nav state.
   ───────────────────────────────────────────────────────────────────── */
function SidebarLogo() {
  return (
    <div className="flex items-center h-16 px-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
      <Link
        to="/"
        className="flex items-center gap-2.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
        aria-label="AssetFlow — go to dashboard"
      >
        <span className="flex items-center justify-center w-7 h-7 rounded bg-[var(--color-accent)] text-white text-xs font-bold tracking-tight shrink-0">
          AF
        </span>
        <span className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight leading-none">
          AssetFlow
        </span>
      </Link>
    </div>
  );
}

/* ── SidebarNav ─────────────────────────────────────────────────────────
   flex-1 scrollable. Only this region has active/hover nav states.
   ───────────────────────────────────────────────────────────────────── */
interface SidebarNavProps {
  visibleItems: typeof NAV_ITEMS;
  currentPath:  string;
  onNavigate?:  () => void;
}

function SidebarNav({ visibleItems, currentPath, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
      <ul className="flex flex-col gap-0.5" role="list">
        {visibleItems.map((item) => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <li key={item.name}>
              <Link
                to={item.path}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                  isActive
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── SidebarUserFooter ──────────────────────────────────────────────────
   Pinned bottom. surface-sunken bg. Sign-out only — no nav states.
   ───────────────────────────────────────────────────────────────────── */
interface SidebarUserFooterProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
}

function SidebarUserFooter({ userName, userRole, onLogout }: SidebarUserFooterProps) {
  return (
    <div className="shrink-0 px-3 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shrink-0">
          {userName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate leading-none">{userName}</p>
          <p className="text-xs text-[var(--color-text-muted)] truncate mt-1 leading-none">{userRole}</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        type="button"
        className="flex w-full items-center justify-center gap-2 py-1.5 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
        Sign Out
      </button>
    </div>
  );
}

/* ── Notifications dropdown ─────────────────────────────────────────── */
interface NotificationDropdownProps {
  notifications: any[];
  unreadCount:   number;
  isOpen:        boolean;
  onToggle:      () => void;
  onMarkRead:    (id: number) => void;
  onMarkAllRead: () => void;
  dropdownRef:   React.RefObject<HTMLDivElement>;
}

function NotificationDropdown({
  notifications, unreadCount, isOpen,
  onToggle, onMarkRead, onMarkAllRead, dropdownRef,
}: NotificationDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-alert)]" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_24px_0_rgba(0,0,0,0.12)] z-50 flex flex-col max-h-96 animate-scale-up"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] shrink-0 rounded-t-lg">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              Notifications {unreadCount > 0 && <span className="text-[var(--color-accent)]">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium focus:outline-none"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-xs text-[var(--color-text-muted)] text-center">No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="menuitem"
                  onClick={() => !n.isRead && onMarkRead(n.id)}
                  className={[
                    'flex gap-2.5 items-start px-4 py-3 text-xs cursor-pointer',
                    'hover:bg-[var(--color-surface-sunken)] transition-colors',
                    !n.isRead ? 'bg-[var(--color-accent-subtle)]' : '',
                  ].join(' ')}
                >
                  {!n.isRead && (
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={['text-[var(--color-text-primary)] leading-snug', !n.isRead ? 'font-semibold' : ''].join(' ')}>
                      {n.message}
                    </p>
                    <p className="text-[var(--color-text-muted)] font-mono text-[11px] mt-0.5">
                      {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Root Layout ────────────────────────────────────────────────────── */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications,    setNotifications]    = useState<any[]>([]);
  const [isNotifOpen,      setIsNotifOpen]      = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const visibleNavItems = NAV_ITEMS.filter(
    item => item.path !== '/org-setup' || user?.role === 'Admin'
  );

  const screenTitle = NAV_ITEMS.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.name ?? 'AssetFlow';

  const sidebarContent = (
    <>
      <SidebarLogo />
      <SidebarNav
        visibleItems={visibleNavItems}
        currentPath={location.pathname}
        onNavigate={() => setIsMobileMenuOpen(false)}
      />
      <SidebarUserFooter
        userName={user?.name ?? 'User'}
        userRole={user?.role ?? ''}
        onLogout={handleLogout}
      />
    </>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* ── Desktop sidebar — fixed 240px ── */}
      <aside
        className="hidden md:flex md:flex-col shrink-0 border-r"
        style={{
          width: '240px',
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="relative flex flex-col h-full border-r animate-slide-up z-10"
            style={{
              width: '240px',
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 8px 24px 0 rgba(0,0,0,0.12)',
            }}
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] focus:outline-none"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Top bar — 64px ── */}
        <header
          className="flex items-center justify-between shrink-0 px-6 border-b z-20"
          style={{
            height: '64px',
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] focus:outline-none"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {screenTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={isNotifOpen}
              onToggle={() => setIsNotifOpen(v => !v)}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              dropdownRef={dropdownRef}
            />

            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>·</span>
              <span>{user?.role}</span>
            </div>
          </div>
        </header>

        {/* ── Content area — max 1280px, 24px padding ── */}
        <main className="flex-1 overflow-auto" style={{ background: 'var(--color-bg)' }}>
          <div className="max-w-[1280px] mx-auto px-6 py-6 animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
