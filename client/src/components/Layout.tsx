import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  User
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Temporary stub user
  const user = {
    name: 'Akshay Kumar',
    email: 'admin@assetflow.dev',
    role: 'Admin',
    department: 'IT Operations'
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: FolderTree },
    { name: 'Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck },
    { name: 'Org Setup', path: '/org-setup', icon: Settings },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Sidebar */}
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
          {navItems.map((item) => {
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
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-muted truncate">{user.role}</p>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-24">
          <h2 className="text-lg font-semibold text-text-primary">
            {navItems.find(item => item.path === location.pathname)?.name || 'AssetFlow'}
          </h2>
          
          <div className="flex items-center gap-16">
            {/* Notification trigger stub */}
            <button className="p-8 text-text-secondary hover:text-accent hover:bg-surface-sunken rounded relative">
              <Bell className="w-20 h-20" />
              <span className="absolute top-4 right-4 w-8 h-8 bg-alert rounded-full"></span>
            </button>

            <div className="h-20 w-1 bg-border"></div>

            <div className="flex items-center gap-8 text-sm text-text-secondary">
              <User className="w-16 h-16" />
              <span>{user.email}</span>
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
