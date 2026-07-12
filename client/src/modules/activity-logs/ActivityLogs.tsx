import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, RotateCcw, ChevronLeft, ChevronRight, FileJson } from 'lucide-react';

interface ActivityLogEntry {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  timestamp: string;
  details: any;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entityType', entityFilter);
      params.append('page', page.toString());
      params.append('limit', '15');

      const response = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || null);
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setError('Could not retrieve activity logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setPage(1);
  };

  // Helper for action badges styling
  const getActionBadgeClass = (action: string) => {
    if (action.includes('CREATE') || action.includes('CONFIRMED')) return 'bg-[#E6F6EE] text-success';
    if (action.includes('RETURN') || action.includes('RESOLVE') || action.includes('CLOSE')) return 'bg-[#EAF0FE] text-info';
    if (action.includes('REQUEST') || action.includes('ASSIGN') || action.includes('START')) return 'bg-[#FBF0DD] text-warning';
    if (action.includes('REJECT') || action.includes('OVERDUE')) return 'bg-[#FBEAE9] text-danger';
    return 'bg-[#EEF0F3] text-text-secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-secondary">Comprehensive history of all accountable operations and changes in the organization.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-subtle text-danger text-sm rounded border border-danger/25">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded border border-border bg-surface flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-10 text-text-muted" />
            <input
              type="text"
              placeholder="Search user, email, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-36 pr-3 py-2 text-sm rounded border border-border bg-surface"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded hover:bg-accent-hover transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded border border-border bg-surface"
          >
            <option value="">All Actions</option>
            <option value="ALLOCATION_CREATE">Allocation Create</option>
            <option value="ALLOCATION_RETURN">Allocation Return</option>
            <option value="ALLOCATION_OVERDUE">Allocation Overdue</option>
            <option value="TRANSFER_REQUEST">Transfer Request</option>
            <option value="TRANSFER_APPROVE">Transfer Approve</option>
            <option value="TRANSFER_REJECT">Transfer Reject</option>
            <option value="BOOKING_CREATE">Booking Create</option>
            <option value="BOOKING_CANCEL">Booking Cancel</option>
            <option value="BOOKING_RESCHEDULE">Booking Reschedule</option>
            <option value="MAINTENANCE_RAISE">Maintenance Raise</option>
            <option value="MAINTENANCE_APPROVE">Maintenance Approve</option>
            <option value="MAINTENANCE_REJECT">Maintenance Reject</option>
            <option value="MAINTENANCE_RESOLVE">Maintenance Resolve</option>
            <option value="MAINTENANCE_ASSIGN">Maintenance Assign</option>
            <option value="MAINTENANCE_START">Maintenance Start Work</option>
            <option value="AUDIT_CREATE">Audit Cycle Create</option>
            <option value="AUDIT_SUBMIT">Audit Submit Item</option>
            <option value="AUDIT_CLOSE">Audit Cycle Close</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded border border-border bg-surface"
          >
            <option value="">All Entity Types</option>
            <option value="Asset">Asset</option>
            <option value="Allocation">Allocation</option>
            <option value="TransferRequest">TransferRequest</option>
            <option value="Booking">Booking</option>
            <option value="MaintenanceRequest">MaintenanceRequest</option>
            <option value="AuditCycle">AuditCycle</option>
            <option value="AuditItem">AuditItem</option>
          </select>

          {(search || actionFilter || entityFilter) && (
            <button
              onClick={handleReset}
              className="p-2 text-text-secondary hover:text-accent rounded border border-border hover:bg-surface-sunken transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid/Table */}
      <div className="rounded border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">
            Loading activity logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-secondary">
            No activity logs found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg/40 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{log.user?.name}</div>
                      <div className="text-xs text-text-muted">{log.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-8 py-1 rounded-badge text-xs font-bold ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-text-primary">{log.entityType}</td>
                    <td className="p-4 font-mono text-xs text-text-secondary">#{log.entityId}</td>
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-text-secondary hover:text-accent rounded hover:bg-surface-sunken transition-colors"
                        title="View Details"
                      >
                        <FileJson className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-[#F7F8FA]">
            <span className="text-xs text-text-secondary">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded border border-border bg-surface text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-sunken transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="p-2 rounded border border-border bg-surface text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-sunken transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface border border-border rounded shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-[#F7F8FA]">
              <h3 className="text-sm font-bold text-text-primary">
                Activity Details (ID: #{selectedLog.id})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-surface-sunken text-[#1A1D23] rounded-b">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  action: selectedLog.action,
                  entityType: selectedLog.entityType,
                  entityId: selectedLog.entityId,
                  timestamp: selectedLog.timestamp,
                  actor: {
                    name: selectedLog.user?.name,
                    email: selectedLog.user?.email,
                    role: selectedLog.user?.role
                  },
                  details: selectedLog.details
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
