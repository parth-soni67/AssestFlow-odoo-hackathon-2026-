import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { 
  FolderTree, 
  UserCheck, 
  Wrench, 
  CalendarDays, 
  ArrowLeftRight, 
  AlertTriangle 
} from 'lucide-react';

interface DashboardStats {
  availableAssets: number;
  allocatedAssets: number;
  underMaintenance: number;
  activeBookingsToday: number;
  pendingTransfers: number;
  overdueReturns: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/activity-logs?limit=5')
        ]);
        setStats(statsRes.data);
        setRecentLogs(logsRes.data.logs || []);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Could not load dashboard statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const kpis = [
    { title: 'Available Assets', value: stats ? stats.availableAssets.toString() : '—', color: 'success', bg: 'bg-success-subtle', text: 'text-success', icon: FolderTree },
    { title: 'Allocated Assets', value: stats ? stats.allocatedAssets.toString() : '—', color: 'info', bg: 'bg-info-subtle', text: 'text-info', icon: UserCheck },
    { title: 'Under Maintenance', value: stats ? stats.underMaintenance.toString() : '—', color: 'alert', bg: 'bg-alert-subtle', text: 'text-alert', icon: Wrench },
    { title: 'Active Bookings Today', value: stats ? stats.activeBookingsToday.toString() : '—', color: 'info', bg: 'bg-info-subtle', text: 'text-info', icon: CalendarDays },
    { title: 'Pending Transfers', value: stats ? stats.pendingTransfers.toString() : '—', color: 'warning', bg: 'bg-warning-subtle', text: 'text-warning', icon: ArrowLeftRight },
    { title: 'Overdue Returns', value: stats ? stats.overdueReturns.toString() : '—', color: 'danger', bg: 'bg-danger-subtle', text: 'text-danger', icon: AlertTriangle },
  ];

  const overdueCount = stats ? stats.overdueReturns : 0;

  return (
    <div className="space-y-24">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Welcome Back, {user?.name || 'User'}</h1>
        <p className="text-sm text-text-secondary">Here is an overview of the organization's resource status today.</p>
      </div>

      {error && (
        <div className="p-16 bg-danger-subtle text-danger text-xs font-semibold rounded border border-danger/10">
          {error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-16">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="p-16 rounded border border-border bg-surface flex flex-col justify-between h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-text-secondary max-w-[80%] leading-tight">{kpi.title}</span>
                <span className={`p-4 rounded ${kpi.bg} ${kpi.text}`}>
                  <Icon className="w-16 h-16" />
                </span>
              </div>
              <div className="text-2xl font-bold text-text-primary mt-12">
                {isLoading ? (
                  <span className="text-sm font-normal text-text-muted">Loading...</span>
                ) : (
                  kpi.value
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue alert section */}
      {overdueCount > 0 && (
        <div className="p-24 rounded border border-alert bg-alert-subtle space-y-12">
          <div className="flex items-center gap-12 text-alert">
            <AlertTriangle className="w-20 h-20" />
            <h3 className="text-lg font-semibold">Critical Overdue Items</h3>
          </div>
          <p className="text-sm text-text-secondary">
            There are {overdueCount} item{overdueCount > 1 ? 's' : ''} currently flagged as overdue. Please coordinate with holders immediately.
          </p>
        </div>
      )}

      {/* Empty States / Main Panels placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Recent Activity Log */}
        <div className="p-24 rounded border border-border bg-surface flex flex-col justify-between min-h-[300px]">
          <div className="space-y-16">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity Log</h3>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="py-24 text-center text-xs text-text-muted">Loading activities...</div>
              ) : recentLogs.length === 0 ? (
                <div className="py-24 text-center text-xs text-text-muted">No activity registered yet</div>
              ) : (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="py-12 text-xs flex justify-between items-center">
                    <div className="space-y-2">
                      <span className="font-semibold text-text-primary">{log.action}</span>
                      <p className="text-text-secondary">By {log.user?.name || log.user?.email}</p>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-12 border-t border-border mt-16">
            <Link 
              to="/activity-log" 
              className="text-xs text-accent hover:text-accent-hover font-semibold inline-block"
            >
              View Full Activity Log &rarr;
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings placeholder */}
        <div className="p-24 rounded border border-border bg-surface flex flex-col justify-between min-h-[300px]">
          <div className="space-y-16">
            <h3 className="text-lg font-semibold text-text-primary">Upcoming Bookings</h3>
            <div className="h-32 border-b border-border flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium">No upcoming bookings for your department</span>
              <span className="text-xs text-text-muted">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
