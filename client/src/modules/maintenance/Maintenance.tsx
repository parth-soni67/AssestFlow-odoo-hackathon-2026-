import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { 
  Wrench, 
  Plus, 
  AlertTriangle, 
  User, 
  Loader2,
  Filter
} from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  assetTag: string;
  status: string;
}

interface MaintenanceRequest {
  id: number;
  assetId: number;
  raisedById: number;
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  photo: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'TechnicianAssigned' | 'InProgress' | 'Resolved';
  assignedTechnician: string | null;
  approvedById: number | null;
  createdAt: string;
  updatedAt: string;
  asset: {
    id: number;
    name: string;
    assetTag: string;
    status: string;
    location: string;
  };
  raisedBy: {
    id: number;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Request modal form state
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  // Technician assignment state
  const [assigningRequestId, setAssigningRequestId] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState('');

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/maintenance');
      setRequests(response.data.requests || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch maintenance requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      // Show assets that are not lost, retired, or disposed
      const activeAssets = (response.data.assets || []).filter(
        (a: Asset) => !['Lost', 'Retired', 'Disposed'].includes(a.status)
      );
      setAssets(activeAssets);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAssets();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !issueDescription.trim()) return;

    try {
      setIsSubmitLoading(true);
      await api.post('/maintenance', {
        assetId: Number(selectedAssetId),
        issueDescription,
        priority
      });
      
      // Reset form
      setSelectedAssetId('');
      setIssueDescription('');
      setPriority('Medium');
      setIsNewRequestOpen(false);
      
      // Refresh
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit maintenance request.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this maintenance request? This will transition the asset status to "Under Maintenance".')) return;
    try {
      await api.post(`/maintenance/${id}/approve`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this maintenance request?')) return;
    try {
      await api.post(`/maintenance/${id}/reject`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRequestId || !technicianName.trim()) return;

    try {
      await api.post(`/maintenance/${assigningRequestId}/assign`, {
        technicianName
      });
      setAssigningRequestId(null);
      setTechnicianName('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign technician.');
    }
  };

  const handleStartWork = async (id: number) => {
    try {
      await api.post(`/maintenance/${id}/start`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start work.');
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm('Are you sure you want to mark this issue resolved? This will return the asset status back to "Available".')) return;
    try {
      await api.post(`/maintenance/${id}/resolve`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve request.');
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-danger-subtle text-danger border-danger/10';
      case 'High':
        return 'bg-alert-subtle text-alert border-alert/10';
      case 'Medium':
        return 'bg-warning-subtle text-warning border-warning/10';
      case 'Low':
      default:
        return 'bg-neutral-subtle text-text-secondary border-border';
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Resolved':
        return 'bg-success-subtle text-success border-success/10';
      case 'Pending':
        return 'bg-warning-subtle text-warning border-warning/10';
      case 'Approved':
        return 'bg-success-subtle text-success border-success/10';
      case 'Rejected':
        return 'bg-danger-subtle text-danger border-danger/10';
      case 'TechnicianAssigned':
      case 'InProgress':
      default:
        return 'bg-info-subtle text-info border-info/10';
    }
  };

  const formatStatusText = (s: string) => {
    if (s === 'TechnicianAssigned') return 'Technician Assigned';
    if (s === 'InProgress') return 'In Progress';
    return s;
  };

  const filteredRequests = requests.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const isManager = user?.role === 'Admin' || user?.role === 'AssetManager';

  return (
    <div className="space-y-24">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Maintenance Management</h1>
          <p className="text-sm text-text-secondary mt-4">
            Track asset physical service actions, raise repair orders, and monitor equipment uptime.
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="px-16 py-8 rounded-sm bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-8 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/15"
        >
          <Plus className="w-16 h-16" />
          <span>Raise Request</span>
        </button>
      </div>

      {error && (
        <div className="p-16 rounded border border-danger/20 bg-danger-subtle text-danger text-xs font-medium flex items-center gap-8">
          <AlertTriangle className="w-16 h-16 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-24">
        {/* Filters Panel */}
        <div className="p-16 rounded border border-border bg-surface flex flex-wrap items-center justify-between gap-16">
          <div className="flex items-center gap-12 text-xs font-medium text-text-secondary">
            <Filter className="w-14 h-14 text-text-muted" />
            <span>Filters:</span>

            {/* Status Filter */}
            <div className="flex flex-col gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface border border-border rounded-md px-12 py-6 text-xs text-text-primary font-medium focus:outline-none focus:border-accent"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="TechnicianAssigned">Technician Assigned</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col gap-4">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-surface border border-border rounded-md px-12 py-6 text-xs text-text-primary font-medium focus:outline-none focus:border-accent"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-semibold text-text-muted">
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="p-48 text-center text-sm text-text-secondary flex justify-center items-center gap-8 bg-surface border border-border rounded">
            <Loader2 className="w-16 h-16 animate-spin text-accent" />
            <span>Loading maintenance requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-48 text-center bg-surface border border-border rounded text-text-secondary flex flex-col items-center justify-center space-y-12">
            <Wrench className="w-32 h-32 text-text-muted stroke-[1.5]" />
            <p className="text-sm font-semibold text-text-primary">No maintenance requests found</p>
            <p className="text-xs max-w-sm text-text-muted">
              There are no service orders matches current filters. Raise a new request to get started.
            </p>
          </div>
        ) : (
          <div className="rounded border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-border text-text-secondary font-bold select-none">
                    <th className="py-12 px-16 w-80">ID</th>
                    <th className="py-12 px-16 w-120">Asset Tag</th>
                    <th className="py-12 px-16">Asset Name</th>
                    <th className="py-12 px-16 w-100">Priority</th>
                    <th className="py-12 px-16 w-140">Status</th>
                    <th className="py-12 px-16 w-140">Technician</th>
                    <th className="py-12 px-16">Issue Description</th>
                    <th className="py-12 px-16 w-120 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text-primary font-sans">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-neutral-subtle/50 transition-colors">
                      <td className="py-12 px-16 font-mono font-bold text-text-secondary">#{req.id}</td>
                      <td className="py-12 px-16 font-mono text-text-primary font-semibold">{req.asset?.assetTag || 'N/A'}</td>
                      <td className="py-12 px-16 font-semibold text-text-primary">{req.asset?.name || 'Unknown Asset'}</td>
                      <td className="py-12 px-16">
                        <span className={`px-8 py-2 rounded-full border text-[10px] font-bold ${getPriorityBadgeClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-12 px-16">
                        <span className={`px-8 py-2 rounded-full border text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                          {formatStatusText(req.status)}
                        </span>
                      </td>
                      <td className="py-12 px-16 font-medium text-text-secondary">
                        {req.assignedTechnician ? (
                          <span className="flex items-center gap-4 text-text-primary font-semibold">
                            <User className="w-12 h-12 text-text-muted" />
                            {req.assignedTechnician}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-12 px-16 text-text-secondary max-w-sm truncate" title={req.issueDescription}>
                        {req.issueDescription}
                      </td>
                      <td className="py-12 px-16 text-right">
                        {isManager ? (
                          <div className="flex justify-end gap-6">
                            {/* Pending State -> Approve/Reject */}
                            {req.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  className="px-8 py-4 rounded-sm bg-success text-white text-[10px] font-semibold hover:bg-success/90 focus:outline-none"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(req.id)}
                                  className="px-8 py-4 rounded-sm bg-danger text-white text-[10px] font-semibold hover:bg-danger/90 focus:outline-none"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Approved State -> Assign Technician */}
                            {req.status === 'Approved' && (
                              <button
                                onClick={() => {
                                  setAssigningRequestId(req.id);
                                  setTechnicianName('');
                                }}
                                className="px-8 py-4 rounded-sm bg-accent text-white text-[10px] font-semibold hover:bg-accent-hover focus:outline-none"
                              >
                                Assign Tech
                              </button>
                            )}

                            {/* Technician Assigned -> Start Work */}
                            {req.status === 'TechnicianAssigned' && (
                              <button
                                onClick={() => handleStartWork(req.id)}
                                className="px-8 py-4 rounded-sm bg-info text-white text-[10px] font-semibold hover:bg-info/90 focus:outline-none"
                              >
                                Start Work
                              </button>
                            )}

                            {/* In Progress -> Resolve */}
                            {req.status === 'InProgress' && (
                              <button
                                onClick={() => handleResolve(req.id)}
                                className="px-8 py-4 rounded-sm bg-success text-white text-[10px] font-semibold hover:bg-success/90 focus:outline-none"
                              >
                                Resolve
                              </button>
                            )}

                            {/* Finished state placeholder */}
                            {(req.status === 'Resolved' || req.status === 'Rejected') && (
                              <span className="text-[10px] text-text-muted italic select-none">No actions</span>
                            )}
                          </div>
                        ) : (
                          // Non-manager can only see no actions
                          <span className="text-[10px] text-text-muted italic select-none">
                            {req.status === 'Pending' ? 'Awaiting Approval' : 'No Actions'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Raise Request */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs"
            onClick={() => setIsNewRequestOpen(false)}
          ></div>

          {/* Dialog Panel */}
          <div className="relative w-full max-w-md bg-surface border border-border rounded shadow-xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-24 py-16 border-b border-border flex justify-between items-center bg-[#F7F8FA]">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-8">
                <Wrench className="w-16 h-16 text-accent" />
                <span>Raise Maintenance Request</span>
              </h3>
              <button
                onClick={() => setIsNewRequestOpen(false)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold focus:outline-none"
              >
                Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRequest} className="p-24 space-y-16">
              {/* Asset Select */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Select Asset</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetTag}) - Status: {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Priority level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Issue Description */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Issue Description</label>
                <textarea
                  required
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the failure, physical damage, or technical malfunction..."
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-12 pt-8">
                <button
                  type="button"
                  onClick={() => setIsNewRequestOpen(false)}
                  className="px-16 py-8 border border-border hover:bg-neutral-subtle rounded-sm text-text-primary text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="px-16 py-8 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold flex items-center gap-6 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitLoading && <Loader2 className="w-14 h-14 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Technician */}
      {assigningRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div 
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs"
            onClick={() => setAssigningRequestId(null)}
          ></div>

          <div className="relative w-full max-w-sm bg-surface border border-border rounded shadow-xl overflow-hidden animate-fade-in">
            <div className="px-24 py-16 border-b border-border flex justify-between items-center bg-[#F7F8FA]">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-8">
                <User className="w-16 h-16 text-accent" />
                <span>Assign Technician</span>
              </h3>
              <button
                onClick={() => setAssigningRequestId(null)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold focus:outline-none"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="p-24 space-y-16">
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Technician Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-12 pt-8">
                <button
                  type="button"
                  onClick={() => setAssigningRequestId(null)}
                  className="px-16 py-8 border border-border hover:bg-neutral-subtle rounded-sm text-text-primary text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-16 py-8 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
