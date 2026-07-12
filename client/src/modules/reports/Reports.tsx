import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FolderTree, 
  AlertTriangle, 
  ShieldAlert,
  Wrench,
  HelpCircle,
  FileCheck,
  Calendar,
  Archive,
  Users,
  DollarSign,
  Grid,
  Download
} from 'lucide-react';

interface AssetUtilization {
  id: number;
  name: string;
  assetTag: string;
  categoryName: string;
  status: string;
  allocationsCount: number;
  bookingsCount: number;
  utilizationHours: number;
}

interface ReportSummary {
  totalAssets: number;
  totalUtilizationHours: number;
  averageUtilizationHours: number;
  topCategory: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'utilization' | 'maintenance' | 'schedules' | 'departments' | 'heatmap'>('utilization');
  
  // Utilization States
  const [utilSummary, setUtilSummary] = useState<ReportSummary | null>(null);
  const [mostUsed, setMostUsed] = useState<AssetUtilization[]>([]);
  const [idle, setIdle] = useState<AssetUtilization[]>([]);
  const [allUtil, setAllUtil] = useState<AssetUtilization[]>([]);
  const [isUtilLoading, setIsUtilLoading] = useState(true);

  // Maintenance States
  const [maintSummary, setMaintSummary] = useState<any | null>(null);
  const [maintByAsset, setMaintByAsset] = useState<any[]>([]);
  const [maintByCategory, setMaintByCategory] = useState<any[]>([]);
  const [isMaintLoading, setIsMaintLoading] = useState(true);

  // Schedules States
  const [schedSummary, setSchedSummary] = useState<any | null>(null);
  const [dueMaint, setDueMaint] = useState<any[]>([]);
  const [dueRetire, setDueRetire] = useState<any[]>([]);
  const [isSchedLoading, setIsSchedLoading] = useState(true);

  // Department Allocations States
  const [deptSummary, setDeptSummary] = useState<any | null>(null);
  const [deptReportList, setDeptReportList] = useState<any[]>([]);
  const [isDeptLoading, setIsDeptLoading] = useState(true);

  // Booking Heatmap States
  const [heatmapSummary, setHeatmapSummary] = useState<any | null>(null);
  const [heatmapList, setHeatmapList] = useState<any[]>([]);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Role Gate check
  const isAuthorized = user?.role === 'Admin' || user?.role === 'AssetManager';

  // Fetch Utilization Data
  const fetchUtilization = async () => {
    try {
      setIsUtilLoading(true);
      const response = await api.get('/reports/utilization');
      setUtilSummary(response.data.summary || null);
      setMostUsed(response.data.mostUsed || []);
      setIdle(response.data.idle || []);
      setAllUtil(response.data.all || []);
    } catch (err: any) {
      console.error('Failed to fetch utilization reports:', err);
      setError('Could not load asset utilization reports. Please try again.');
    } finally {
      setIsUtilLoading(false);
    }
  };

  // Fetch Maintenance Data
  const fetchMaintenance = async () => {
    try {
      setIsMaintLoading(true);
      const response = await api.get('/reports/maintenance');
      setMaintSummary(response.data.summary || null);
      setMaintByAsset(response.data.byAsset || []);
      setMaintByCategory(response.data.byCategory || []);
    } catch (err: any) {
      console.error('Failed to fetch maintenance reports:', err);
      setError('Could not load asset maintenance reports. Please try again.');
    } finally {
      setIsMaintLoading(false);
    }
  };

  // Fetch Schedules Data
  const fetchSchedules = async () => {
    try {
      setIsSchedLoading(true);
      const response = await api.get('/reports/maintenance-retirement');
      setSchedSummary(response.data.summary || null);
      setDueMaint(response.data.dueForMaintenance || []);
      setDueRetire(response.data.dueForRetirement || []);
    } catch (err: any) {
      console.error('Failed to fetch schedules reports:', err);
      setError('Could not load lifecycle and schedule reports. Please try again.');
    } finally {
      setIsSchedLoading(false);
    }
  };

  // Fetch Department Allocations Data
  const fetchDepartmentAllocations = async () => {
    try {
      setIsDeptLoading(true);
      const response = await api.get('/reports/department-allocations');
      setDeptSummary(response.data.summary || null);
      setDeptReportList(response.data.departments || []);
    } catch (err: any) {
      console.error('Failed to fetch department allocations:', err);
      setError('Could not load department allocations. Please try again.');
    } finally {
      setIsDeptLoading(false);
    }
  };

  // Fetch Booking Heatmap Data
  const fetchBookingHeatmap = async () => {
    try {
      setIsHeatmapLoading(true);
      const response = await api.get('/reports/booking-heatmap');
      setHeatmapSummary(response.data.summary || null);
      setHeatmapList(response.data.heatmap || []);
    } catch (err: any) {
      console.error('Failed to fetch booking heatmap:', err);
      setError('Could not load booking heatmaps. Please try again.');
    } finally {
      setIsHeatmapLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    
    if (activeTab === 'utilization') {
      fetchUtilization();
    } else if (activeTab === 'maintenance') {
      fetchMaintenance();
    } else if (activeTab === 'schedules') {
      fetchSchedules();
    } else if (activeTab === 'departments') {
      fetchDepartmentAllocations();
    } else {
      fetchBookingHeatmap();
    }
  }, [activeTab, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="p-12 text-center bg-surface border border-border rounded max-w-md mx-auto space-y-4 mt-12">
        <ShieldAlert className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Access Gated</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          The Reports & Analytics section is reserved exclusively for Administrators and Asset Managers.
        </p>
      </div>
    );
  }

  const maxHours = mostUsed.length > 0 ? mostUsed[0].utilizationHours : 1;
  const maxMaintAssetCount = maintByAsset.length > 0 ? maintByAsset[0].totalCount : 1;
  const maxDeptValue = deptReportList.length > 0 ? deptReportList[0].totalValue : 1;

  // Heatmap Constants
  const businessHours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun index mapping
  const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#F3F4F6] hover:bg-neutral-subtle border-border/40';
    if (count === 1) return 'bg-[#D1FAE5] text-[#047857] hover:bg-[#A7F3D0] border-[#A7F3D0]';
    if (count === 2) return 'bg-[#A7F3D0] text-[#065F46] hover:bg-[#6EE7B7] border-[#6EE7B7]';
    if (count === 3) return 'bg-[#6EE7B7] text-[#064E3B] hover:bg-[#34D399] border-[#34D399]';
    if (count <= 5) return 'bg-[#34D399] text-white hover:bg-[#10B981] border-[#10B981]';
    return 'bg-[#059669] text-white hover:bg-[#047857] border-[#047857]';
  };

  const getCellCount = (day: number, hour: number) => {
    const match = heatmapList.find(item => item.day === day && item.hour === hour);
    return match ? match.count : 0;
  };

  // CSV Exporter Helper Utility
  const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadUtilizationCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Status', 'Allocations Count', 'Bookings Count', 'Utilization Hours'];
    const rows = allUtil.map(item => [
      item.assetTag,
      item.name,
      item.categoryName,
      item.status,
      item.allocationsCount,
      item.bookingsCount,
      item.utilizationHours
    ]);
    exportToCSV('asset_utilization_report.csv', headers, rows);
  };

  const downloadMaintenanceCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Pending Tickets', 'In Progress Tickets', 'Resolved Tickets', 'Rejected Tickets', 'Total Incidents'];
    const rows = maintByAsset.map(item => [
      item.assetTag,
      item.name,
      item.categoryName,
      item.pendingCount,
      item.inProgressCount,
      item.resolvedCount,
      item.rejectedCount,
      item.totalCount
    ]);
    exportToCSV('maintenance_frequency_report.csv', headers, rows);
  };

  const downloadMaintenanceSchedulesCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Condition', 'Last Maintenance Date', 'Elapsed Months', 'Reason'];
    const rows = dueMaint.map(item => [
      item.assetTag,
      item.name,
      item.categoryName,
      item.condition,
      item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleDateString() : 'Never inspected',
      item.elapsedMonths,
      item.reason
    ]);
    exportToCSV('due_for_maintenance_report.csv', headers, rows);
  };

  const downloadRetirementSchedulesCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Acquisition Date', 'Asset Age (Months)', 'Useful Life (Months)', 'Reason'];
    const rows = dueRetire.map(item => [
      item.assetTag,
      item.name,
      item.categoryName,
      new Date(item.acquisitionDate).toLocaleDateString(),
      item.ageMonths,
      item.usefulLifeMonths,
      item.reason
    ]);
    exportToCSV('due_for_retirement_report.csv', headers, rows);
  };

  const downloadDepartmentCSV = () => {
    const headers = ['Department Name', 'Department Head', 'Allocated Assets Count', 'Total Financial Value ($)'];
    const rows = deptReportList.map(item => [
      item.name,
      item.headName,
      item.assetCount,
      item.totalValue
    ]);
    exportToCSV('department_allocations_report.csv', headers, rows);
  };

  const downloadHeatmapCSV = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const headers = ['Day of Week', 'Hour of Day', 'Active Bookings'];
    const rows = heatmapList.map(item => [
      days[item.day],
      `${item.hour.toString().padStart(2, '0')}:00`,
      item.count
    ]);
    exportToCSV('booking_heatmap_report.csv', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-sm text-text-secondary">Analyze asset utilization trends, maintenance frequencies, and lifecycle efficiency.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab('utilization'); setError(null); }}
          className={`px-16 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'utilization'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Asset Utilization
        </button>
        <button
          onClick={() => { setActiveTab('maintenance'); setError(null); }}
          className={`px-16 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'maintenance'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Maintenance Analytics
        </button>
        <button
          onClick={() => { setActiveTab('schedules'); setError(null); }}
          className={`px-16 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedules'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Schedules & Lifecycle
        </button>
        <button
          onClick={() => { setActiveTab('departments'); setError(null); }}
          className={`px-16 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Department Allocations
        </button>
        <button
          onClick={() => { setActiveTab('heatmap'); setError(null); }}
          className={`px-16 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'heatmap'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Booking Heatmap
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger-subtle text-danger text-sm rounded border border-danger/25">
          {error}
        </div>
      )}

      {/* RENDER UTILIZATION TAB */}
      {activeTab === 'utilization' && (
        isUtilLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading utilization summaries...</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {utilSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Scoped Assets</span>
                    <span className="p-1 rounded bg-info-subtle text-info">
                      <FolderTree className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{utilSummary.totalAssets}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Utilization</span>
                    <span className="p-1 rounded bg-info-subtle text-info">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{utilSummary.totalUtilizationHours} hrs</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Average Asset Usage</span>
                    <span className="p-1 rounded bg-success-subtle text-success">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{utilSummary.averageUtilizationHours} hrs</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Top Category</span>
                    <span className="p-1 rounded bg-warning-subtle text-warning">
                      <BarChart3 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-sm font-bold text-text-primary mt-3 truncate">{utilSummary.topCategory}</div>
                </div>
              </div>
            )}

            {/* Grid Layout for Most-Used vs Idle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Assets */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">Most-Used Assets</h3>
                <div className="space-y-4">
                  {mostUsed.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-muted">No usage logs recorded yet</div>
                  ) : (
                    mostUsed.map((item) => {
                      const ratio = Math.min(100, Math.max(0, (item.utilizationHours / maxHours) * 100));
                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-text-primary">{item.name} ({item.assetTag})</span>
                            <span className="text-text-secondary">{item.utilizationHours} hrs</span>
                          </div>
                          <div className="w-full bg-surface-sunken h-2 rounded-badge overflow-hidden">
                            <div className="bg-accent h-full rounded-badge" style={{ width: `${ratio}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-text-muted">
                            <span>{item.categoryName}</span>
                            <span>{item.allocationsCount} allocs, {item.bookingsCount} bookings</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Idle / Low Utilization Assets */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-18 h-18 text-warning" />
                  <span>Idle / Low Usage Assets</span>
                </h3>
                <div className="divide-y divide-border">
                  {idle.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-muted">No idle assets found</div>
                  ) : (
                    idle.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-text-primary block">{item.name}</span>
                          <span className="text-text-muted text-[10px]">{item.categoryName} &middot; Tag: {item.assetTag}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-badge bg-neutral-subtle text-neutral-status text-[10px] font-bold">
                            {item.status}
                          </span>
                          <span className="block text-[10px] text-text-secondary mt-1">0 hrs logged</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detailed All Assets Table */}
            <div className="p-6 card-premium animate-scale-up space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">All Asset Utilization Metrics</h3>
                <button
                  onClick={downloadUtilizationCSV}
                  className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                      <th className="p-3">Tag</th>
                      <th className="p-3">Asset Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Allocations</th>
                      <th className="p-3 text-center">Bookings</th>
                      <th className="p-3 text-right">Total Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {allUtil.map((item) => (
                      <tr key={item.id} className="hover:bg-bg/20 transition-colors">
                        <td className="p-3 font-mono text-text-secondary">{item.assetTag}</td>
                        <td className="p-3 font-semibold text-text-primary">{item.name}</td>
                        <td className="p-3 text-text-secondary">{item.categoryName}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-badge bg-neutral-subtle text-neutral-status font-bold text-[10px]">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-center text-text-secondary">{item.allocationsCount}</td>
                        <td className="p-3 text-center text-text-secondary">{item.bookingsCount}</td>
                        <td className="p-3 text-right font-bold text-text-primary">{item.utilizationHours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* RENDER MAINTENANCE TAB */}
      {activeTab === 'maintenance' && (
        isMaintLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading maintenance summaries...</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {maintSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Raised Tickets</span>
                    <span className="p-1 rounded bg-info-subtle text-info">
                      <Wrench className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{maintSummary.totalRequests}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Resolved Requests</span>
                    <span className="p-1 rounded bg-success-subtle text-success">
                      <FileCheck className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{maintSummary.byStatus?.Resolved || 0}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Pending Reviews</span>
                    <span className="p-1 rounded bg-warning-subtle text-warning">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{maintSummary.byStatus?.Pending || 0}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Critical Level Failures</span>
                    <span className="p-1 rounded bg-danger-subtle text-danger">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{maintSummary.byPriority?.Critical || 0}</div>
                </div>
              </div>
            )}

            {/* Grid Layout for breakdowns by Category vs breakdown lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Failure distributions */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">Breakdown Rate by Category</h3>
                <div className="divide-y divide-border">
                  {maintByCategory.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-muted">No maintenance request categories registered</div>
                  ) : (
                    maintByCategory.map((cat) => (
                      <div key={cat.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-text-primary block">{cat.name}</span>
                          <span className="text-text-muted text-[10px]">{cat.resolvedCount} resolved &middot; {cat.pendingCount} pending</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-badge bg-[#FBEAE9] text-danger text-[10px] font-bold">
                            {cat.totalCount} ticket{cat.totalCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* High breakdown frequency assets */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-18 h-18 text-danger" />
                  <span>High-Breakdown Assets</span>
                </h3>
                <div className="space-y-4">
                  {maintByAsset.filter(a => a.totalCount > 0).length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-muted">No assets with breakdown logs found</div>
                  ) : (
                    maintByAsset.filter(a => a.totalCount > 0).slice(0, 5).map((item) => {
                      const ratio = Math.min(100, Math.max(0, (item.totalCount / maxMaintAssetCount) * 100));
                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-text-primary">{item.name} ({item.assetTag})</span>
                            <span className="text-text-secondary text-danger">{item.totalCount} incidents</span>
                          </div>
                          <div className="w-full bg-surface-sunken h-2 rounded-badge overflow-hidden">
                            <div className="bg-danger h-full rounded-badge" style={{ width: `${ratio}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-text-muted">
                            <span>{item.categoryName}</span>
                            <span>{item.resolvedCount} resolved, {item.pendingCount} pending</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Breakdown Priority Distribution Details Table */}
            <div className="p-6 card-premium animate-scale-up space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Breakdown Distribution Matrix</h3>
                <button
                  onClick={downloadMaintenanceCSV}
                  className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                      <th className="p-3">Asset Tag</th>
                      <th className="p-3">Asset Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Pending Tickets</th>
                      <th className="p-3 text-center">In Progress Tickets</th>
                      <th className="p-3 text-center">Resolved Tickets</th>
                      <th className="p-3 text-right">Total incidents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {maintByAsset.map((item) => (
                      <tr key={item.id} className="hover:bg-bg/20 transition-colors">
                        <td className="p-3 font-mono text-text-secondary">{item.assetTag}</td>
                        <td className="p-3 font-semibold text-text-primary">{item.name}</td>
                        <td className="p-3 text-text-secondary">{item.categoryName}</td>
                        <td className="p-3 text-center text-text-secondary">{item.pendingCount}</td>
                        <td className="p-3 text-center text-text-secondary">{item.inProgressCount}</td>
                        <td className="p-3 text-center text-success">{item.resolvedCount}</td>
                        <td className={`p-12 text-right font-bold ${item.totalCount > 0 ? 'text-danger' : 'text-text-muted'}`}>
                          {item.totalCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* RENDER SCHEDULES TAB */}
      {activeTab === 'schedules' && (
        isSchedLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading schedules and lifecycle data...</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {schedSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Due for Routine Maintenance</span>
                    <span className="p-1 rounded bg-warning-subtle text-warning">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{schedSummary.totalDueForMaintenance}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Due for Retirement</span>
                    <span className="p-1 rounded bg-danger-subtle text-danger">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{schedSummary.totalDueForRetirement}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Retired Assets Count</span>
                    <span className="p-1 rounded bg-neutral-subtle text-text-secondary">
                      <Archive className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{schedSummary.totalRetired}</div>
                </div>
              </div>
            )}

            {/* Grid Tables for Maintenance Schedule vs Retirement */}
            <div className="space-y-6">
              {/* Due for Maintenance Table */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-text-primary">Routine Maintenance Due (6-Month Inspect Intervals)</h3>
                  <button
                    onClick={downloadMaintenanceSchedulesCSV}
                    className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                        <th className="p-3">Tag</th>
                        <th className="p-3">Asset Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Condition</th>
                        <th className="p-3 text-center">Last Maintenance Check</th>
                        <th className="p-3 text-center">Elapsed</th>
                        <th className="p-3 text-right">Reason for Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {dueMaint.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-text-muted">No assets currently overdue for maintenance</td>
                        </tr>
                      ) : (
                        dueMaint.map((item) => (
                          <tr key={item.id} className="hover:bg-bg/20 transition-colors">
                            <td className="p-3 font-mono text-text-secondary">{item.assetTag}</td>
                            <td className="p-3 font-semibold text-text-primary">{item.name}</td>
                            <td className="p-3 text-text-secondary">{item.categoryName}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-badge bg-neutral-subtle text-neutral-status font-bold text-[10px]">
                                {item.condition}
                              </span>
                            </td>
                            <td className="p-3 text-center text-text-secondary">
                              {item.lastMaintenanceDate 
                                ? new Date(item.lastMaintenanceDate).toLocaleDateString()
                                : <span className="italic text-text-muted">Never inspected</span>
                              }
                            </td>
                            <td className="p-3 text-center text-warning font-semibold">{item.elapsedMonths} months</td>
                            <td className="p-3 text-right text-text-secondary font-medium">{item.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Due for Retirement Table */}
              <div className="p-6 card-premium animate-scale-up space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-danger">Retirement Lifecycle Schedule</h3>
                  <button
                    onClick={downloadRetirementSchedulesCSV}
                    className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                        <th className="p-3">Tag</th>
                        <th className="p-3">Asset Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Acquisition Date</th>
                        <th className="p-3 text-center">Asset Age</th>
                        <th className="p-3 text-center">Useful Life</th>
                        <th className="p-3 text-right">Retirement Status / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {dueRetire.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-text-muted">No assets flagged for retirement</td>
                        </tr>
                      ) : (
                        dueRetire.map((item) => (
                          <tr key={item.id} className="hover:bg-bg/20 transition-colors">
                            <td className="p-3 font-mono text-text-secondary">{item.assetTag}</td>
                            <td className="p-3 font-semibold text-text-primary">{item.name}</td>
                            <td className="p-3 text-text-secondary">{item.categoryName}</td>
                            <td className="p-3 text-text-secondary">{new Date(item.acquisitionDate).toLocaleDateString()}</td>
                            <td className="p-3 text-center font-medium">{item.ageMonths} months</td>
                            <td className="p-3 text-center text-text-muted">{item.usefulLifeMonths} months</td>
                            <td className="p-3 text-right text-danger font-medium">{item.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* RENDER DEPARTMENT ALLOCATIONS TAB */}
      {activeTab === 'departments' && (
        isDeptLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading department allocations data...</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {deptSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Active Departments</span>
                    <span className="p-1 rounded bg-info-subtle text-info">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{deptSummary.totalDepartmentsCount}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Allocated Assets</span>
                    <span className="p-1 rounded bg-success-subtle text-success">
                      <FolderTree className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{deptSummary.totalAllocatedAssets}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Capital Assigned</span>
                    <span className="p-1 rounded bg-warning-subtle text-warning">
                      <DollarSign className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">${deptSummary.totalAllocatedValue.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Department Summary Table */}
            <div className="p-6 card-premium animate-scale-up space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Department-wise Asset Allocation</h3>
                <button
                  onClick={downloadDepartmentCSV}
                  className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F7F8FA] text-xs font-bold text-text-secondary">
                      <th className="p-3">Department Name</th>
                      <th className="p-3">Department Head</th>
                      <th className="p-3 text-center">Allocated Assets</th>
                      <th className="p-3 text-center">Department Asset Value Share</th>
                      <th className="p-3 text-right">Total Financial Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {deptReportList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-text-muted">No allocations found for departments</td>
                      </tr>
                    ) : (
                      deptReportList.map((item) => {
                        const ratio = Math.min(100, Math.max(0, (item.totalValue / maxDeptValue) * 100));
                        return (
                          <tr key={item.id} className="hover:bg-bg/20 transition-colors">
                            <td className="p-3">
                              <span className="font-semibold text-text-primary block">{item.name}</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.categoryBreakdown.slice(0, 3).map((breakdown: any) => (
                                  <span key={breakdown.categoryName} className="px-1.5 py-0.5 rounded bg-surface-sunken border border-border text-[9px] text-text-secondary">
                                    {breakdown.categoryName}: {breakdown.count}
                                  </span>
                                ))}
                                {item.categoryBreakdown.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[9px] text-text-muted italic">
                                    +{item.categoryBreakdown.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-text-secondary font-medium">{item.headName}</td>
                            <td className="p-3 text-center font-bold text-text-primary">{item.assetCount} items</td>
                            <td className="p-3 max-w-[200px]">
                              <div className="w-full bg-surface-sunken h-2 rounded-badge overflow-hidden">
                                <div className="bg-accent h-full rounded-badge" style={{ width: `${ratio}%` }}></div>
                              </div>
                              <span className="text-[10px] text-text-muted mt-1 block">
                                {((item.totalValue / (deptSummary?.totalAllocatedValue || 1)) * 100).toFixed(1)}% of total value
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-text-primary">${item.totalValue.toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* RENDER BOOKING HEATMAP TAB */}
      {activeTab === 'heatmap' && (
        isHeatmapLoading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading booking heatmap data...</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {heatmapSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Total Scheduled Reservations</span>
                    <span className="p-1 rounded bg-info-subtle text-info">
                      <FolderTree className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{heatmapSummary.totalBookings}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Peak Reservation Day</span>
                    <span className="p-1 rounded bg-success-subtle text-success">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mt-3">{heatmapSummary.peakDay}</div>
                </div>

                <div className="p-4 card-premium animate-scale-up flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-text-secondary">Peak Usage Time Slot</span>
                    <span className="p-1 rounded bg-warning-subtle text-warning">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-sm font-bold text-text-primary mt-3">{heatmapSummary.peakHour}</div>
                </div>
              </div>
            )}

            {/* Visual Heatmap Grid */}
            <div className="p-6 card-premium animate-scale-up space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Grid className="w-18 h-18 text-accent" />
                  <span>Time-Slot Utilization Heatmap</span>
                </h3>
                {/* Actions & Legend */}
                <div className="flex items-center gap-6">
                  {/* Legend */}
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded bg-[#F3F4F6] border border-border/40"></div>
                    <div className="w-3 h-3 rounded bg-[#D1FAE5] border border-[#A7F3D0]"></div>
                    <div className="w-3 h-3 rounded bg-[#A7F3D0] border border-[#6EE7B7]"></div>
                    <div className="w-3 h-3 rounded bg-[#6EE7B7] border border-[#34D399]"></div>
                    <div className="w-3 h-3 rounded bg-[#34D399] border border-[#10B981]"></div>
                    <div className="w-3 h-3 rounded bg-[#059669] border border-[#047857]"></div>
                    <span>More</span>
                  </div>
                  {/* Export */}
                  <button
                    onClick={downloadHeatmapCSV}
                    className="px-3 py-2 rounded border border-border hover:bg-neutral-subtle text-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[800px] pb-3">
                  {/* Grid header (Hours) */}
                  <div className="grid grid-cols-[100px_repeat(13,1fr)] gap-2 text-center text-xs font-bold text-text-secondary mb-3">
                    <div className="text-left pl-2">Day</div>
                    {businessHours.map(hour => (
                      <div key={hour} className="font-mono text-[10px]">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  {/* Grid rows (Days) */}
                  <div className="space-y-2">
                    {dayIndices.map((dayIdx, labelIdx) => (
                      <div key={dayIdx} className="grid grid-cols-[100px_repeat(13,1fr)] gap-2 items-center">
                        <div className="text-xs font-semibold text-text-primary pl-2">
                          {daysLabel[labelIdx]}
                        </div>
                        {businessHours.map((hour) => {
                          const count = getCellCount(dayIdx, hour);
                          return (
                            <div
                              key={hour}
                              className={`h-36 rounded border transition-colors flex items-center justify-center font-mono text-[10px] font-bold ${getHeatmapColor(count)}`}
                              title={`${daysLabel[labelIdx]} @ ${hour.toString().padStart(2, '0')}:00 - ${count} active bookings`}
                            >
                              {count > 0 && count}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
