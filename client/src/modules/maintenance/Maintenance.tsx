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
    <div className="flex flex-col gap-6 font-sans animate-fade-in" style={{ color: 'var(--color-text-primary)' }}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Maintenance Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Track asset physical service actions, raise repair orders, and monitor equipment uptime.
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--color-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
        >
          <Plus className="w-4 h-4" />
          <span>Raise Request</span>
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 border rounded text-xs font-semibold flex items-center gap-2" style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="flex flex-col gap-4">
        {/* Filters Panel — compact row like AssetDirectory */}
        <div className="flex flex-col md:flex-row gap-2 p-3 rounded-lg border items-center justify-between" style={{ background: 'var(--color-surface-sunken)', borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <Filter className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border text-sm focus:outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="TechnicianAssigned">Technician Assigned</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-9 px-3 rounded-md border text-sm focus:outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-semibold shrink-0 mt-2 md:mt-0" style={{ color: 'var(--color-text-muted)' }}>
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm flex justify-center items-center gap-2 rounded-lg border" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span>Loading maintenance requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center rounded-lg border flex flex-col items-center justify-center gap-3" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <Wrench className="w-10 h-10 stroke-[1.5]" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No maintenance requests found</p>
            <p className="text-xs max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
              There are no service orders matches current filters. Raise a new request to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b font-semibold select-none" style={{ background: 'var(--color-surface-sunken)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th className="py-3 px-4 w-[80px]">ID</th>
                    <th className="py-3 px-4 w-[120px]">Asset Tag</th>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4 w-[100px]">Priority</th>
                    <th className="py-3 px-4 w-[140px]">Status</th>
                    <th className="py-3 px-4 w-[140px]">Technician</th>
                    <th className="py-3 px-4">Issue Description</th>
                    <th className="py-3 px-4 w-[120px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-sans" style={{ color: 'var(--color-text-primary)' }}>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="transition-colors hover:bg-neutral-subtle/50">
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: 'var(--color-text-secondary)' }}>#{req.id}</td>
                      <td className="py-3 px-4 font-mono font-medium">{req.asset?.assetTag || 'N/A'}</td>
                      <td className="py-3 px-4 font-medium">{req.asset?.name || 'Unknown Asset'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getPriorityBadgeClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                          {formatStatusText(req.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {req.assignedTechnician ? (
                          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                            {req.assignedTechnician}
                          </span>
                        ) : (
                          <span className="italic" style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" style={{ color: 'var(--color-text-secondary)' }} title={req.issueDescription}>
                        {req.issueDescription}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isManager ? (
                          <div className="flex justify-end gap-1.5">
                            {/* Pending State -> Approve/Reject */}
                            {req.status === 'Pending' && (
                              <>
                                <button onClick={() => handleApprove(req.id)} className="px-2 py-1 rounded text-white text-[10px] font-semibold hover:opacity-90 focus:outline-none" style={{ background: 'var(--color-success)' }}>
                                  Approve
                                </button>
                                <button onClick={() => handleReject(req.id)} className="px-2 py-1 rounded text-white text-[10px] font-semibold hover:opacity-90 focus:outline-none" style={{ background: 'var(--color-danger)' }}>
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Approved State -> Assign Technician */}
                            {req.status === 'Approved' && (
                              <button onClick={() => { setAssigningRequestId(req.id); setTechnicianName(''); }} className="px-2 py-1 rounded text-white text-[10px] font-semibold hover:opacity-90 focus:outline-none" style={{ background: 'var(--color-accent)' }}>
                                Assign Tech
                              </button>
                            )}

                            {/* Technician Assigned -> Start Work */}
                            {req.status === 'TechnicianAssigned' && (
                              <button onClick={() => handleStartWork(req.id)} className="px-2 py-1 rounded text-white text-[10px] font-semibold hover:opacity-90 focus:outline-none" style={{ background: 'var(--color-info)' }}>
                                Start Work
                              </button>
                            )}

                            {/* In Progress -> Resolve */}
                            {req.status === 'InProgress' && (
                              <button onClick={() => handleResolve(req.id)} className="px-2 py-1 rounded text-white text-[10px] font-semibold hover:opacity-90 focus:outline-none" style={{ background: 'var(--color-success)' }}>
                                Resolve
                              </button>
                            )}

                            {/* Finished state placeholder */}
                            {(req.status === 'Resolved' || req.status === 'Rejected') && (
                              <span className="text-[10px] italic select-none" style={{ color: 'var(--color-text-muted)' }}>No actions</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] italic select-none" style={{ color: 'var(--color-text-muted)' }}>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-[500px] rounded-lg border shadow-[0_8px_24px_0_rgba(0,0,0,0.12)] animate-scale-up overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-sunken)' }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Wrench className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span>Raise Maintenance Request</span>
              </h3>
              <button onClick={() => setIsNewRequestOpen(false)} className="text-sm font-semibold focus:outline-none" style={{ color: 'var(--color-text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-secondary)' }}>Select Asset</label>
                <select required value={selectedAssetId} onChange={(e) => setSelectedAssetId(Number(e.target.value))} className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                  <option value="">-- Choose Asset --</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Status: {a.status}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-secondary)' }}>Priority level</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-secondary)' }}>Issue Description</label>
                <textarea required rows={4} value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Describe the failure, physical damage, or technical malfunction..." className="px-3 py-2 rounded-md border text-sm focus:outline-none resize-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-2" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" onClick={() => setIsNewRequestOpen(false)} className="px-4 py-2 rounded-md border text-sm font-medium transition-colors" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}>Cancel</button>
                <button type="submit" disabled={isSubmitLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>
                  {isSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Technician */}
      {assigningRequestId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-[400px] rounded-lg border shadow-[0_8px_24px_0_rgba(0,0,0,0.12)] animate-scale-up overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-sunken)' }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span>Assign Technician</span>
              </h3>
              <button onClick={() => setAssigningRequestId(null)} className="text-sm font-semibold focus:outline-none" style={{ color: 'var(--color-text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-secondary)' }}>Technician Name</label>
                <input type="text" required placeholder="e.g. John Doe" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-2" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" onClick={() => setAssigningRequestId(null)} className="px-4 py-2 rounded-md border text-sm font-medium transition-colors" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors" style={{ background: 'var(--color-accent)' }}>Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
