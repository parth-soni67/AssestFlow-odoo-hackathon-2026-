/**
 * Dashboard — landing screen.
 *
 * DESIGN_GUIDE §4: "The Dashboard is the closest thing to a hero screen
 * and should lead with the KPI card row, not decorative imagery."
 *
 * KPI grid: CSS grid auto-fit, minmax(200px, 1fr), gap-4 (16px).
 * All metric cards use the shared <KpiCard> component — never hand-rolled.
 * At most 3 font sizes visible at once (text-xl title, text-sm body, text-xs meta).
 */

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
  AlertTriangle,
} from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import type { StatusTier } from '../../components/StatusBadge';

interface DashboardStats {
  availableAssets:    number;
  allocatedAssets:    number;
  underMaintenance:   number;
  activeBookingsToday:number;
  pendingTransfers:   number;
  overdueReturns:     number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,      setStats]      = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/activity-logs?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentLogs(logsRes.data.logs || []);
      } catch {
        setError('Could not load dashboard statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // KPI definitions — tier drives icon-badge colour via StatusBadge lookup
  const kpis: Array<{
    label: string;
    value: number | string;
    icon: typeof FolderTree;
    tier: StatusTier;
  }> = [
    {
      label: 'Available Assets',
      value: stats?.availableAssets ?? '—',
      icon:  FolderTree,
      tier:  'success',
    },
    {
      label: 'Allocated Assets',
      value: stats?.allocatedAssets ?? '—',
      icon:  UserCheck,
      tier:  'info',
    },
    {
      label: 'Under Maintenance',
      value: stats?.underMaintenance ?? '—',
      icon:  Wrench,
      tier:  'alert',
    },
    {
      label: 'Active Bookings Today',
      value: stats?.activeBookingsToday ?? '—',
      icon:  CalendarDays,
      tier:  'info',
    },
    {
      label: 'Pending Transfers',
      value: stats?.pendingTransfers ?? '—',
      icon:  ArrowLeftRight,
      tier:  'warning',
    },
    {
      label: 'Overdue Returns',
      value: stats?.overdueReturns ?? '—',
      icon:  AlertTriangle,
      tier:  'danger',
    },
  ];

  const overdueCount = stats?.overdueReturns ?? 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page heading — text-xl per DESIGN_GUIDE §2 screen titles ── */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          Welcome back, {user?.name ?? 'User'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Here is an overview of the organisation's resource status today.
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 bg-danger-subtle border border-danger text-danger text-sm rounded"
        >
          {error}
        </div>
      )}

      {/* ── KPI row — DESIGN_GUIDE §4: auto-fit grid, gap-4 (16px) ── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            tier={kpi.tier}
            loading={isLoading}
          />
        ))}
      </div>

      {/* ── Overdue alert — only shown when there are overdue items ── */}
      {!isLoading && overdueCount > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 bg-alert-subtle border border-alert rounded"
        >
          <AlertTriangle className="w-5 h-5 text-alert shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-alert">
              {overdueCount} overdue return{overdueCount !== 1 ? 's' : ''} require attention
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Coordinate with asset holders immediately to resolve overdue allocations.
            </p>
          </div>
        </div>
      )}

      {/* ── Secondary panels — activity log + upcoming bookings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <div className="bg-surface border border-border rounded p-6 shadow-card flex flex-col min-h-80">
          <h3 className="text-sm font-semibold text-text-primary pb-3 border-b border-border">
            Recent Activity
          </h3>

          <div className="flex-1 divide-y divide-border mt-3">
            {isLoading ? (
              <p className="py-6 text-xs text-text-muted text-center">Loading…</p>
            ) : recentLogs.length === 0 ? (
              <p className="py-6 text-xs text-text-muted text-center">No activity recorded yet.</p>
            ) : (
              recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 px-2 hover:bg-surface-sunken rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{log.action}</p>
                    <p className="text-xs text-text-muted">
                      {log.user?.name ?? log.user?.email}
                    </p>
                  </div>
                  <time
                    className="text-xs font-mono text-text-muted shrink-0"
                    dateTime={log.timestamp}
                  >
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-border mt-3">
            <Link to="/activity-log" className="text-xs font-semibold text-accent hover:text-accent-hover">
              View full log →
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-surface border border-border rounded p-6 shadow-card flex flex-col min-h-80">
          <h3 className="text-sm font-semibold text-text-primary pb-3 border-b border-border">
            Upcoming Bookings
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
            <CalendarDays className="w-8 h-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary text-center max-w-xs">
              No upcoming bookings scheduled for your department this week.
            </p>
          </div>

          <div className="pt-3 border-t border-border mt-3">
            <Link to="/bookings" className="text-xs font-semibold text-accent hover:text-accent-hover">
              Schedule a booking →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
