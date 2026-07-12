/**
 * Layout — app shell.
 *
 * DESIGN_GUIDE §4 topology — EXACT:
 *
 *   Fixed 240px sidebar  │  64px top bar
 *                        │  ─────────────────────────────────
 *                        │  Content: max-w-[1280px], centered
 *                        │  px-6 (24px) desktop / px-4 (16px) mobile
 *
 * Sidebar has exactly THREE sibling regions, each a separate sub-component
 * with its own container. None of the three ever shares a hover, active, or
 * selected state with either of the others. They are siblings — never nested
 * inside a shared clickable wrapper.
 *
 *   <SidebarLogo />        — fixed 64px height, brand only, no hover state
 *   <SidebarNav />         — flex-1, scrollable, nav links with active state
 *   <SidebarUserFooter />  — pinned bottom, surface-sunken bg, sign-out only
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

/* ── Nav item definitions ─────────────────────────────────────────────── */

const NAV_ITEMS = [
  { name: 'Dashboard',    path: '/',            icon: LayoutDashboard },
  { name: 'Assets',       path: '/assets',      icon: FolderTree      },
  { name: 'Bookings',     path: '/bookings',    icon: CalendarDays    },
  { name: 'Maintenance',  path: '/maintenance', icon: Wrench          },
  { name: 'Audits',       path: '/audits',      icon: ClipboardCheck  },
  { name: 'Activity Log', path: '/activity-log',icon: History         },
  { name: 'Org Setup',    path: '/org-setup',   icon: Settings        },
  { name: 'Reports',      path: '/reports',     icon: BarChart3       },
];

/* ── Sub-components ───────────────────────────────────────────────────── */

/**
 * SidebarLogo
 * Fixed 64px height. Brand wordmark only.
 * No hover state. No active state. Never clickable as a nav item.
 * The Link wraps the brand only so the logo navigates home — it is NOT
 * a nav link and has no selected/active visual treatment.
 */
function SidebarLogo() {
  return (
    <div
      className="flex items-center h-16 px-4 border-b border-border bg-surface shrink-0"
      // 64px height = spacing-16 token
    >
      <Link
        to="/"
        className="flex items-center gap-2 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        aria-label="AssetFlow home"
      >
        {/* Brand mark */}
        <span className="flex items-center justify-center w-8 h-8 rounded bg-accent text-white text-xs font-bold shrink-0">
          AF
        </span>
        <span className="text-sm font-bold text-text-primary tracking-tight">
          AssetFlow
        </span>
      </Link>
    </div>
  );
}

/**
 * SidebarNav
 * flex-1, scrollable, contains nav links.
 * Only this region ever shows active/hover nav states.
 */
interface SidebarNavProps {
  visibleItems: typeof NAV_ITEMS;
  currentPath: string;
  onNavigate?: () => void;
}

function SidebarNav({ visibleItems, currentPath, onNavigate }: SidebarNavProps) {
  return (
    <nav
      className="flex-1 overflow-y-auto py-2 px-2"
      // py-8 px-8 = inner breathing room
      aria-label="Main navigation"
    >
      <ul className="flex flex-col gap-1" role="list">
        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
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
                  'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive
                    ? 'bg-accent-subtle text-accent font-semibold'
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
                ].join(' ')}
              >
                {/* Left accent bar for active state */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 bg-accent rounded-r" aria-hidden="true" />
                )}
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * SidebarUserFooter
 * Pinned to bottom. surface-sunken background.
 * No hover/active nav state — sign-out action only.
 */
interface SidebarUserFooterProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
}

function SidebarUserFooter({ userName, userRole, onLogout }: SidebarUserFooterProps) {
  return (
    <div className="shrink-0 p-4 border-t border-border bg-surface-sunken">
      {/* User identity — not clickable, not a nav item */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-xs font-bold shrink-0">
          {userName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate leading-none">{userName}</p>
          <p className="text-xs text-text-muted truncate mt-1">{userRole}</p>
        </div>
      </div>

      {/* Sign out — secondary action, not a nav link */}
      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 h-9 px-3 rounded border border-border bg-surface text-xs font-semibold text-text-secondary transition-colors hover:bg-surface hover:text-danger hover:border-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        type="button"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Sign Out
      </button>
    </div>
  );
}

/* ── Notifications dropdown ───────────────────────────────────────────── */

interface NotificationDropdownProps {
  notifications: any[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

function NotificationDropdown({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkRead,
  onMarkAllRead,
  dropdownRef,
}: NotificationDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="relative flex items-center justify-center w-9 h-9 rounded text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-alert" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-80 bg-surface border border-border rounded shadow-dropdown z-50 flex flex-col max-h-96 animate-scale-up"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-sunken shrink-0">
            <span className="text-xs font-semibold text-text-primary">
              Notifications {unreadCount > 0 && <span className="text-accent">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="p-6 text-xs text-text-muted text-center">No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="menuitem"
                  onClick={() => !n.isRead && onMarkRead(n.id)}
                  className={[
                    'flex gap-2 items-start px-4 py-3 text-xs cursor-pointer',
                    'hover:bg-surface-sunken transition-colors',
                    !n.isRead ? 'bg-accent-subtle' : '',
                  ].join(' ')}
                >
                  {!n.isRead && (
                    <span className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={['text-text-primary leading-snug', !n.isRead ? 'font-semibold' : ''].join(' ')}>
                      {n.message}
                    </p>
                    <p className="text-text-muted mt-1 font-mono text-xs">
                      {new Date(n.createdAt).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
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

/* ── Root Layout ──────────────────────────────────────────────────────── */

export default function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const [notifications,    setNotifications]    = useState<any[]>([]);
  const [isNotifOpen,      setIsNotifOpen]      = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Fetch notifications */
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

  /* Close notification dropdown on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  // Admin-only items filtered out for non-admins
  const visibleNavItems = NAV_ITEMS.filter(
    item => item.path !== '/org-setup' || user?.role === 'Admin'
  );

  // Current screen title for top bar
  const screenTitle =
    NAV_ITEMS.find(item =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    )?.name ?? 'AssetFlow';

  /* ── Shared sidebar content (desktop + mobile) ── */
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
    <div className="flex h-screen w-screen overflow-hidden bg-bg">

      {/* ── Desktop sidebar — fixed 240px ── */}
      <aside className="hidden md:flex md:flex-col md:w-sidebar shrink-0 border-r border-border bg-surface relative z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex flex-col w-sidebar bg-surface border-r border-border h-full shadow-dropdown animate-slide-up z-10">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:bg-surface-sunken transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Main column (top bar + content) ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Top bar — fixed 64px ── */}
        <header className="flex items-center justify-between h-16 px-6 bg-surface border-b border-border shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded text-text-secondary hover:bg-surface-sunken transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Screen title */}
            <h1 className="text-base font-semibold text-text-primary">{screenTitle}</h1>
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

            <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{user?.name}</span>
              <span className="text-text-muted">·</span>
              <span>{user?.role}</span>
            </div>
          </div>
        </header>

        {/* ── Content area ── */}
        <main className="flex-1 overflow-auto bg-bg">
          <div className="max-w-content mx-auto px-6 py-6 md:px-6 animate-slide-up">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
