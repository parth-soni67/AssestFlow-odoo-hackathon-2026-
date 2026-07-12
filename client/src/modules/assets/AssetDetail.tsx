import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Tag, Calendar, MapPin, DollarSign, 
  Layers, History, Wrench, User, Building 
} from 'lucide-react';

interface Allocation {
  id: number;
  allocatedDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  returnConditionNotes: string | null;
  status: 'Active' | 'Returned' | 'Overdue';
  employee?: { id: number; name: string; email: string } | null;
  department?: { id: number; name: string } | null;
}

interface MaintenanceRequest {
  id: number;
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Approved' | 'Rejected' | 'TechnicianAssigned' | 'InProgress' | 'Resolved';
  assignedTechnician: string | null;
  createdAt: string;
  raisedBy: { id: number; name: string };
  approvedBy?: { id: number; name: string } | null;
}

interface Asset {
  id: number;
  name: string;
  assetTag: string;
  serialNumber: string;
  qrCode: string | null;
  acquisitionDate: string;
  acquisitionCost: string;
  condition: string;
  location: string;
  isBookable: boolean;
  status: 'Available' | 'Allocated' | 'Reserved' | 'UnderMaintenance' | 'Lost' | 'Retired' | 'Disposed';
  category: {
    id: number;
    name: string;
    customFields: { name: string; type: string; required: boolean }[] | null;
  };
  currentDepartment?: { id: number; name: string } | null;
  currentHolder?: { id: number; name: string; email: string } | null;
  allocations: Allocation[];
  maintenanceRequests: MaintenanceRequest[];
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'allocations' | 'maintenance'>('allocations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAsset = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data.asset);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to fetch asset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'Available': return 'bg-success-subtle text-success border-success/25';
      case 'Allocated': return 'bg-info-subtle text-info border-info/25';
      case 'Reserved': return 'bg-warning-subtle text-warning border-warning/25';
      case 'UnderMaintenance': return 'bg-alert-subtle text-alert border-alert/25';
      case 'Lost': return 'bg-danger-subtle text-danger border-danger/25';
      case 'Retired': return 'bg-neutral-subtle text-neutral-status border-border';
      default: return 'bg-neutral-subtle text-neutral-status border-border';
    }
  };

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'Critical':
      case 'High': 
        return 'bg-danger-subtle text-danger border-danger/25';
      case 'Medium': 
        return 'bg-warning-subtle text-warning border-warning/25';
      case 'Low':
      default: 
        return 'bg-success-subtle text-success border-success/25';
    }
  };

  if (loading) {
    return <div className="text-center py-48 text-xs text-[#5B6270]">Loading asset details...</div>;
  }

  if (error || !asset) {
    return (
      <div className="space-y-16">
        <Link to="/assets" className="inline-flex items-center gap-8 text-xs font-semibold text-accent">
          <ArrowLeft className="w-16 h-16" />
          <span>Back to directory</span>
        </Link>
        <div className="p-16 bg-danger-subtle text-danger border border-danger/15 text-xs font-semibold rounded-sm">
          {error || 'Asset not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 font-sans text-text-primary">
      {/* Navigation Header */}
      <div>
        <Link to="/assets" className="inline-flex items-center gap-8 text-xs font-semibold text-accent hover:text-accent-hover">
          <ArrowLeft className="w-16 h-16" />
          <span>Back to directory</span>
        </Link>
      </div>

      {/* Main Asset Header Info Card */}
      <div className="card-premium p-24 space-y-20 animate-scale-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-16">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-12">
              <span className="font-mono text-xs font-semibold text-text-secondary bg-surface-sunken px-8 py-4 border border-border rounded-sm flex items-center gap-4">
                <Tag className="w-12 h-12" />
                {asset.assetTag}
              </span>
              <span className={`text-[10px] px-8 py-2 font-bold rounded-full border ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
              {asset.isBookable && (
                <span className="bg-accent-subtle text-accent text-[10px] px-8 py-2 border border-accent/15 rounded font-semibold">
                  Bookable Shared Resource
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-text-primary">{asset.name}</h1>
            <p className="text-xs text-text-secondary">{asset.category.name}</p>
          </div>
        </div>

        {/* Technical & Acquisition Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-16 pt-16 border-t border-border/40 text-xs">
          <div className="space-y-4">
            <span className="text-text-secondary block">Serial Number</span>
            <strong className="font-mono text-text-primary">{asset.serialNumber}</strong>
          </div>
          <div className="space-y-4">
            <span className="text-text-secondary block">Current Location</span>
            <div className="flex items-center gap-4 text-text-primary font-semibold">
              <MapPin className="w-12 h-12 text-text-muted" />
              {asset.location}
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-text-secondary block">Acquisition Cost</span>
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <DollarSign className="w-12 h-12 text-text-muted" />
              {asset.acquisitionCost} USD
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-text-secondary block">Acquisition Date</span>
            <div className="flex items-center gap-4 text-text-primary font-semibold">
              <Calendar className="w-12 h-12 text-text-muted" />
              {new Date(asset.acquisitionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Holder / Assignee Block */}
      {(asset.currentHolder || asset.currentDepartment) && (
        <div className="p-16 border border-accent/20 bg-accent-subtle/30 rounded flex items-center gap-16 animate-scale-up">
          <div className="p-8 rounded-full bg-accent-subtle text-accent">
            {asset.currentHolder ? <User className="w-20 h-20" /> : <Building className="w-20 h-20" />}
          </div>
          <div className="text-xs">
            <p className="text-text-secondary">Current Assignee / Holder</p>
            {asset.currentHolder ? (
              <p className="font-bold text-sm text-text-primary">
                {asset.currentHolder.name} <span className="text-xs font-normal text-text-secondary">({asset.currentHolder.email})</span>
              </p>
            ) : (
              <p className="font-bold text-sm text-text-primary">{asset.currentDepartment?.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Category Specifications Schema details */}
      {asset.category.customFields && Object.keys(asset.category.customFields).length > 0 && (
        <div className="card-premium p-20 space-y-12 animate-scale-up">
          <h3 className="text-xs font-bold text-text-secondary flex items-center gap-8 uppercase tracking-wider">
            <Layers className="w-14 h-14 text-text-muted" />
            Category Specification Fields Schema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-xs">
            {Array.isArray(asset.category.customFields) ? (
              asset.category.customFields.map((field: any, idx) => (
                <div key={idx} className="bg-surface-sunken border border-border p-12 rounded-sm flex items-center justify-between">
                  <span className="font-semibold text-text-primary">{field.name}</span>
                  <span className="text-text-secondary font-mono text-[10px] bg-surface px-6 py-2 border border-border rounded-sm">
                    {field.type} {field.required && '*'}
                  </span>
                </div>
              ))
            ) : (
              Object.entries(asset.category.customFields).map(([key, val]: any, idx) => (
                <div key={idx} className="bg-surface-sunken border border-border p-12 rounded-sm flex items-center justify-between">
                  <span className="font-semibold text-text-primary">{key}</span>
                  <span className="text-text-secondary font-mono text-[10px] bg-surface px-6 py-2 border border-border rounded-sm">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History Tabs Navigation */}
      <div className="space-y-16">
        <div className="flex gap-24 border-b border-border pb-4">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none flex items-center gap-8 ${
              activeTab === 'allocations' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <History className="w-16 h-16" />
            <span>Allocation History ({asset.allocations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none flex items-center gap-8 ${
              activeTab === 'maintenance' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Wrench className="w-16 h-16" />
            <span>Maintenance History ({asset.maintenanceRequests.length})</span>
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
          {/* --- ALLOCATIONS HISTORY --- */}
          {activeTab === 'allocations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-border text-xs font-semibold text-text-secondary">
                    <th className="p-16">Assignee / Department</th>
                    <th className="p-16">Allocated Date</th>
                    <th className="p-16">Return Dates</th>
                    <th className="p-16">Return Condition Notes</th>
                    <th className="p-16 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {asset.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center text-text-secondary text-xs">
                        No allocation logs found for this asset.
                      </td>
                    </tr>
                  ) : (
                    asset.allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-neutral-subtle/20 transition-colors">
                        <td className="p-16">
                          {alloc.employee ? (
                            <div>
                              <p className="font-semibold text-xs">{alloc.employee.name}</p>
                              <p className="text-text-secondary text-[10px]">{alloc.employee.email}</p>
                            </div>
                          ) : (
                            <p className="font-semibold text-xs">{alloc.department?.name}</p>
                          )}
                        </td>
                        <td className="p-16 text-xs text-text-secondary">
                          {new Date(alloc.allocatedDate).toLocaleDateString()}
                        </td>
                        <td className="p-16 text-xs">
                          <p className="text-text-secondary">Expected: {new Date(alloc.expectedReturnDate).toLocaleDateString()}</p>
                          {alloc.actualReturnDate && (
                            <p className="text-success font-medium">Returned: {new Date(alloc.actualReturnDate).toLocaleDateString()}</p>
                          )}
                        </td>
                        <td className="p-16 text-xs text-text-secondary">
                          {alloc.returnConditionNotes || <span className="text-text-muted">—</span>}
                        </td>
                        <td className="p-16 text-right">
                          <span className={`inline-block text-[10px] px-8 py-2 font-bold rounded-full border ${
                            alloc.status === 'Active' ? 'bg-info-subtle text-info border-info/25' :
                            alloc.status === 'Returned' ? 'bg-success-subtle text-success border-success/25' :
                            'bg-danger-subtle text-danger border-danger/25'
                          }`}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* --- MAINTENANCE HISTORY --- */}
          {activeTab === 'maintenance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-border text-xs font-semibold text-text-secondary">
                    <th className="p-16">Issue Details</th>
                    <th className="p-16">Reported By</th>
                    <th className="p-16">Reported Date</th>
                    <th className="p-16">Technician & Priority</th>
                    <th className="p-16 text-right">Request Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {asset.maintenanceRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center text-text-secondary text-xs">
                        No maintenance requests recorded for this asset.
                      </td>
                    </tr>
                  ) : (
                    asset.maintenanceRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-neutral-subtle/20 transition-colors">
                        <td className="p-16 max-w-[200px] truncate font-medium text-xs">
                          {req.issueDescription}
                        </td>
                        <td className="p-16 text-xs text-text-secondary">
                          {req.raisedBy.name}
                        </td>
                        <td className="p-16 text-xs text-text-secondary">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-16 text-xs space-y-4">
                          <p className="text-text-secondary">Tech: {req.assignedTechnician || <span className="text-text-muted">Unassigned</span>}</p>
                          <span className={`inline-block text-[9px] px-6 py-1 font-bold rounded border ${getPriorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="p-16 text-right">
                          <span className={`inline-block text-[10px] px-8 py-2 font-bold rounded-full border ${
                            req.status === 'Resolved' ? 'bg-success-subtle text-success border-success/25' :
                            req.status === 'Approved' || req.status === 'TechnicianAssigned' || req.status === 'InProgress' ? 'bg-info-subtle text-info border-info/25' :
                            req.status === 'Pending' ? 'bg-warning-subtle text-warning border-warning/25' :
                            'bg-danger-subtle text-danger border-danger/25'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
