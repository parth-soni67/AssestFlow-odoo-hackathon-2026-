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
      case 'Available': return 'bg-[#E6F6EE] text-[#1E8E5A] border-[#1E8E5A]/25';
      case 'Allocated': return 'bg-[#EBF3FC] text-[#2F5DE0] border-[#2F5DE0]/25';
      case 'Reserved': return 'bg-[#FFF9E6] text-[#B78103] border-[#B78103]/25';
      case 'UnderMaintenance': return 'bg-[#F2F4F7] text-[#5B6270] border-[#5B6270]/25';
      case 'Lost': return 'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25';
      default: return 'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25';
    }
  };

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'High': return 'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25';
      case 'Medium': return 'bg-[#FFF9E6] text-[#B78103] border-[#B78103]/25';
      default: return 'bg-[#F2F4F7] text-[#5B6270] border-[#5B6270]/25';
    }
  };

  if (loading) {
    return <div className="text-center py-48 text-xs text-[#5B6270]">Loading asset details...</div>;
  }

  if (error || !asset) {
    return (
      <div className="space-y-16">
        <Link to="/assets" className="inline-flex items-center gap-8 text-xs font-semibold text-[#2F5DE0]">
          <ArrowLeft className="w-16 h-16" />
          <span>Back to directory</span>
        </Link>
        <div className="p-16 bg-[#FBEAE9] text-[#C1352E] border border-[#C1352E]/35 text-sm rounded-[6px]">
          {error || 'Asset not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 font-sans text-[#1A1D23]">
      {/* Navigation Header */}
      <div>
        <Link to="/assets" className="inline-flex items-center gap-8 text-xs font-semibold text-[#2F5DE0] hover:text-[#274CBD]">
          <ArrowLeft className="w-16 h-16" />
          <span>Back to directory</span>
        </Link>
      </div>

      {/* Main Asset Header Info Card */}
      <div className="bg-white border border-[#DDE1E6] rounded-[6px] shadow-sm p-24 space-y-20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-16">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-12">
              <span className="font-mono text-xs font-semibold text-[#5B6270] bg-[#F7F8FA] px-8 py-4 border border-[#DDE1E6] rounded-[4px] flex items-center gap-4">
                <Tag className="w-12 h-12" />
                {asset.assetTag}
              </span>
              <span className={`text-[10px] px-8 py-2 font-bold rounded-full border ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
              {asset.isBookable && (
                <span className="bg-[#EBF3FC] text-[#2F5DE0] text-[10px] px-8 py-2 border border-[#2F5DE0]/15 rounded font-semibold">
                  Bookable Shared Resource
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#1A1D23]">{asset.name}</h1>
            <p className="text-xs text-[#5B6270]">{asset.category.name}</p>
          </div>
        </div>

        {/* Technical & Acquisition Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-16 pt-16 border-t border-[#F7F8FA] text-xs">
          <div className="space-y-4">
            <span className="text-[#5B6270] block">Serial Number</span>
            <strong className="font-mono text-[#1A1D23]">{asset.serialNumber}</strong>
          </div>
          <div className="space-y-4">
            <span className="text-[#5B6270] block">Current Location</span>
            <div className="flex items-center gap-4 text-[#1A1D23] font-semibold">
              <MapPin className="w-12 h-12 text-[#C4C9D1]" />
              {asset.location}
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-[#5B6270] block">Acquisition Cost</span>
            <div className="flex items-center gap-2 text-[#1A1D23] font-semibold">
              <DollarSign className="w-12 h-12 text-[#C4C9D1]" />
              {asset.acquisitionCost} USD
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-[#5B6270] block">Acquisition Date</span>
            <div className="flex items-center gap-4 text-[#1A1D23] font-semibold">
              <Calendar className="w-12 h-12 text-[#C4C9D1]" />
              {new Date(asset.acquisitionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Holder / Assignee Block */}
      {(asset.currentHolder || asset.currentDepartment) && (
        <div className="p-16 border border-[#2F5DE0]/25 bg-[#EBF3FC]/30 rounded-[6px] flex items-center gap-16">
          <div className="p-8 rounded-full bg-[#2F5DE0]/10 text-[#2F5DE0]">
            {asset.currentHolder ? <User className="w-20 h-20" /> : <Building className="w-20 h-20" />}
          </div>
          <div className="text-xs">
            <p className="text-[#5B6270]">Current Assignee / Holder</p>
            {asset.currentHolder ? (
              <p className="font-bold text-sm text-[#1A1D23]">
                {asset.currentHolder.name} <span className="text-xs font-normal text-[#5B6270]">({asset.currentHolder.email})</span>
              </p>
            ) : (
              <p className="font-bold text-sm text-[#1A1D23]">{asset.currentDepartment?.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Category Specifications Schema details */}
      {asset.category.customFields && Object.keys(asset.category.customFields).length > 0 && (
        <div className="bg-white border border-[#DDE1E6] rounded-[6px] p-20 space-y-12">
          <h3 className="text-xs font-bold text-[#5B6270] flex items-center gap-8 uppercase tracking-wider">
            <Layers className="w-14 h-14 text-[#C4C9D1]" />
            Category Specification Fields Schema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-xs">
            {Array.isArray(asset.category.customFields) ? (
              asset.category.customFields.map((field: any, idx) => (
                <div key={idx} className="bg-[#F7F8FA] border border-[#DDE1E6] p-12 rounded-[4px] flex items-center justify-between">
                  <span className="font-semibold text-[#1A1D23]">{field.name}</span>
                  <span className="text-[#5B6270] font-mono text-[10px] bg-white px-6 py-2 border border-[#DDE1E6] rounded">
                    {field.type} {field.required && '*'}
                  </span>
                </div>
              ))
            ) : (
              Object.entries(asset.category.customFields).map(([key, val]: any, idx) => (
                <div key={idx} className="bg-[#F7F8FA] border border-[#DDE1E6] p-12 rounded-[4px] flex items-center justify-between">
                  <span className="font-semibold text-[#1A1D23]">{key}</span>
                  <span className="text-[#5B6270] font-mono text-[10px] bg-white px-6 py-2 border border-[#DDE1E6] rounded">
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
        <div className="flex gap-24 border-b border-[#DDE1E6] pb-4">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none flex items-center gap-8 ${
              activeTab === 'allocations' 
                ? 'border-[#2F5DE0] text-[#2F5DE0]' 
                : 'border-transparent text-[#5B6270] hover:text-[#1A1D23]'
            }`}
          >
            <History className="w-16 h-16" />
            <span>Allocation History ({asset.allocations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none flex items-center gap-8 ${
              activeTab === 'maintenance' 
                ? 'border-[#2F5DE0] text-[#2F5DE0]' 
                : 'border-transparent text-[#5B6270] hover:text-[#1A1D23]'
            }`}
          >
            <Wrench className="w-16 h-16" />
            <span>Maintenance History ({asset.maintenanceRequests.length})</span>
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="bg-white border border-[#DDE1E6] rounded-[6px] shadow-sm overflow-hidden">
          {/* --- ALLOCATIONS HISTORY --- */}
          {activeTab === 'allocations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#DDE1E6] text-xs font-semibold text-[#5B6270]">
                    <th className="p-16">Assignee / Department</th>
                    <th className="p-16">Allocated Date</th>
                    <th className="p-16">Return Dates</th>
                    <th className="p-16">Return Condition Notes</th>
                    <th className="p-16 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E6] text-sm text-[#1A1D23]">
                  {asset.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center text-[#5B6270] text-xs">
                        No allocation logs found for this asset.
                      </td>
                    </tr>
                  ) : (
                    asset.allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-[#F7F8FA]/50 transition-colors">
                        <td className="p-16">
                          {alloc.employee ? (
                            <div>
                              <p className="font-semibold text-xs">{alloc.employee.name}</p>
                              <p className="text-[#5B6270] text-[10px]">{alloc.employee.email}</p>
                            </div>
                          ) : (
                            <p className="font-semibold text-xs">{alloc.department?.name}</p>
                          )}
                        </td>
                        <td className="p-16 text-xs text-[#5B6270]">
                          {new Date(alloc.allocatedDate).toLocaleDateString()}
                        </td>
                        <td className="p-16 text-xs">
                          <p className="text-[#5B6270]">Expected: {new Date(alloc.expectedReturnDate).toLocaleDateString()}</p>
                          {alloc.actualReturnDate && (
                            <p className="text-[#1E8E5A] font-medium">Returned: {new Date(alloc.actualReturnDate).toLocaleDateString()}</p>
                          )}
                        </td>
                        <td className="p-16 text-xs text-[#5B6270]">
                          {alloc.returnConditionNotes || <span className="text-[#C4C9D1]">—</span>}
                        </td>
                        <td className="p-16 text-right">
                          <span className={`inline-block text-[10px] px-8 py-2 font-bold rounded-full border ${
                            alloc.status === 'Active' ? 'bg-[#EBF3FC] text-[#2F5DE0] border-[#2F5DE0]/25' :
                            alloc.status === 'Returned' ? 'bg-[#E6F6EE] text-[#1E8E5A] border-[#1E8E5A]/25' :
                            'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25'
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
                  <tr className="bg-[#F7F8FA] border-b border-[#DDE1E6] text-xs font-semibold text-[#5B6270]">
                    <th className="p-16">Issue Details</th>
                    <th className="p-16">Reported By</th>
                    <th className="p-16">Reported Date</th>
                    <th className="p-16">Technician & Priority</th>
                    <th className="p-16 text-right">Request Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E6] text-sm text-[#1A1D23]">
                  {asset.maintenanceRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center text-[#5B6270] text-xs">
                        No maintenance requests recorded for this asset.
                      </td>
                    </tr>
                  ) : (
                    asset.maintenanceRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#F7F8FA]/50 transition-colors">
                        <td className="p-16 max-w-[200px] truncate font-medium text-xs">
                          {req.issueDescription}
                        </td>
                        <td className="p-16 text-xs text-[#5B6270]">
                          {req.raisedBy.name}
                        </td>
                        <td className="p-16 text-xs text-[#5B6270]">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-16 text-xs space-y-4">
                          <p className="text-[#5B6270]">Tech: {req.assignedTechnician || <span className="text-[#C4C9D1]">Unassigned</span>}</p>
                          <span className={`inline-block text-[9px] px-6 py-1 font-bold rounded border ${getPriorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="p-16 text-right">
                          <span className={`inline-block text-[10px] px-8 py-2 font-bold rounded-full border ${
                            req.status === 'Resolved' ? 'bg-[#E6F6EE] text-[#1E8E5A] border-[#1E8E5A]/25' :
                            req.status === 'Approved' || req.status === 'TechnicianAssigned' || req.status === 'InProgress' ? 'bg-[#EBF3FC] text-[#2F5DE0] border-[#2F5DE0]/25' :
                            req.status === 'Pending' ? 'bg-[#FFF9E6] text-[#B78103] border-[#B78103]/25' :
                            'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25'
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
