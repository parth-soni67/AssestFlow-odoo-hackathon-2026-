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
  User,
  CheckCheck,
  History,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: FolderTree },
    { name: 'Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck },
    { name: 'Activity Log', path: '/activity-log', icon: History },
    { name: 'Org Setup', path: '/org-setup', icon: Settings },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // Only allow Admins to see the Organization Setup navigation item
  const visibleNavItems = navItems.filter(
    (item) => item.path !== '/org-setup' || user?.role === 'Admin'
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col border-r border-border bg-surface">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-24 border-b border-border">
          <Link to="/" className="flex items-center gap-8 font-sans font-bold text-lg text-accent">
            <span className="bg-accent text-white px-8 py-4 rounded text-sm font-black">AF</span>
            <span>AssetFlow</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-12 py-16 space-y-4 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-12 px-12 py-8 text-sm font-medium rounded transition-colors ${
                  isActive 
                    ? 'bg-accent-subtle text-accent' 
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
                }`}
              >
                <Icon className="w-20 h-20" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-16 border-t border-border bg-surface-sunken">
          <div className="flex items-center gap-12 mb-12">
            <div className="w-32 h-32 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'User'}</p>
               <p className="text-xs text-text-muted truncate">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-8 px-12 py-8 text-xs font-semibold text-text-secondary hover:text-accent rounded border border-border bg-surface hover:bg-surface-sunken transition-colors"
          >
            <LogOut className="w-16 h-16" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-text-primary/45 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative flex w-[240px] flex-col bg-surface border-r border-border h-full p-16 shadow-xl animate-fade-in">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-8 border-b border-border mb-16">
              <Link 
                to="/" 
                className="flex items-center gap-8 font-sans font-bold text-lg text-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="bg-accent text-white px-8 py-4 rounded text-sm font-black">AF</span>
                <span>AssetFlow</span>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-8 text-text-secondary hover:text-text-primary focus:outline-none"
              >
                <X className="w-20 h-20" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-4 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-12 px-12 py-8 text-sm font-medium rounded transition-colors ${
                      isActive 
                        ? 'bg-accent-subtle text-accent' 
                        : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-20 h-20" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info Footer */}
            <div className="p-16 border-t border-border bg-surface-sunken rounded mt-16">
              <div className="flex items-center gap-12 mb-12">
                <div className="w-32 h-32 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-text-muted truncate">{user?.role || 'Guest'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-8 px-12 py-8 text-xs font-semibold text-text-secondary hover:text-accent rounded border border-border bg-surface hover:bg-surface-sunken transition-colors"
              >
                <LogOut className="w-16 h-16" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-24">
          <div className="flex items-center gap-12">
            {/* Hamburger Trigger button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-8 text-text-secondary hover:text-text-primary hover:bg-surface-sunken rounded md:hidden transition-colors"
            >
              <Menu className="w-20 h-20" />
            </button>
            <h2 className="text-lg font-semibold text-text-primary">
              {navItems.find(item => item.path === location.pathname)?.name || 'AssetFlow'}
            </h2>
          </div>
          
          <div className="flex items-center gap-16">
            {/* Notification trigger dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-8 text-text-secondary hover:text-accent hover:bg-surface-sunken rounded relative flex items-center justify-center transition-colors"
                title="Notifications"
              >
                <Bell className="w-20 h-20" />
                {unreadCount > 0 && (
                  <span className="absolute top-4 right-4 w-8 h-8 bg-alert rounded-full flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-8 w-[320px] bg-surface border border-border rounded shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
                  {/* Dropdown Header */}
                  <div className="px-16 py-12 border-b border-border flex items-center justify-between bg-[#F7F8FA]">
                    <span className="text-xs font-bold text-text-primary">Notifications ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-accent hover:text-accent-hover font-semibold flex items-center gap-4"
                      >
                        <CheckCheck className="w-12 h-12" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  <div className="overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-24 text-center text-xs text-text-muted">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`p-12 hover:bg-[#F7F8FA]/60 transition-colors cursor-pointer text-xs flex gap-8 items-start ${
                            !n.isRead ? 'bg-accent-subtle/30 font-medium' : ''
                          }`}
                        >
                          {!n.isRead && (
                            <span className="w-6 h-6 mt-6 bg-accent rounded-full shrink-0"></span>
                          )}
                          <div className="space-y-4 flex-1">
                            <p className="text-text-primary leading-snug">{n.message}</p>
                            <p className="text-[10px] text-text-muted">
                              {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-20 w-1 bg-border"></div>

            <div className="flex items-center gap-8 text-sm text-text-secondary">
              <User className="w-16 h-16" />
              <span>{user?.email || 'Not logged in'}</span>
            </div>
          </div>
        </header>

        {/* Screen Content */}
        <main className="flex-1 overflow-auto p-24">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
