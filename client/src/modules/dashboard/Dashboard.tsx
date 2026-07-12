import { 
  FolderTree, 
  UserCheck, 
  Wrench, 
  CalendarDays, 
  ArrowLeftRight, 
  AlertTriangle 
} from 'lucide-react';

export default function Dashboard() {
  const kpis = [
    { title: 'Available Assets', value: '18', color: 'success', bg: 'bg-[#E6F6EE]', text: 'text-success', icon: FolderTree },
    { title: 'Allocated Assets', value: '12', color: 'info', bg: 'bg-[#EAF0FE]', text: 'text-info', icon: UserCheck },
    { title: 'Under Maintenance', value: '2', color: 'alert', bg: 'bg-[#FCEAE1]', text: 'text-alert', icon: Wrench },
    { title: 'Active Bookings Today', value: '5', color: 'info', bg: 'bg-[#EAF0FE]', text: 'text-info', icon: CalendarDays },
    { title: 'Pending Transfers', value: '1', color: 'warning', bg: 'bg-[#FBF0DD]', text: 'text-warning', icon: ArrowLeftRight },
    { title: 'Overdue Returns', value: '3', color: 'danger', bg: 'bg-[#FBEAE9]', text: 'text-danger', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-24">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Welcome Back, Akshay</h1>
        <p className="text-sm text-text-secondary">Here is an overview of the organization's resource status today.</p>
      </div>

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
              <div className="text-2xl font-bold text-text-primary mt-12">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Overdue alert section */}
      <div className="p-24 rounded border border-alert bg-[#FCEAE1]/50 space-y-12">
        <div className="flex items-center gap-12 text-alert">
          <AlertTriangle className="w-20 h-20" />
          <h3 className="text-lg font-semibold">Critical Overdue Items</h3>
        </div>
        <p className="text-sm text-text-secondary">
          There are 3 items currently flagged as overdue. Please coordinate with holders immediately.
        </p>
      </div>

      {/* Empty States / Main Panels placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div className="p-24 rounded border border-border bg-surface space-y-16">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity Log</h3>
          <div className="h-32 border-b border-border flex items-center justify-between text-sm">
            <span className="text-text-secondary font-medium">No activity registered yet</span>
            <span className="text-xs text-text-muted">—</span>
          </div>
        </div>

        <div className="p-24 rounded border border-border bg-surface space-y-16">
          <h3 className="text-lg font-semibold text-text-primary">Upcoming Bookings</h3>
          <div className="h-32 border-b border-border flex items-center justify-between text-sm">
            <span className="text-text-secondary font-medium">No upcoming bookings for your department</span>
            <span className="text-xs text-text-muted">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}
