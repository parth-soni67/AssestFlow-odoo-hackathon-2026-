import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { 
  ClipboardCheck, 
  Plus, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Calendar,
  Building,
  MapPin,
  ShieldAlert
} from 'lucide-react';

interface AuditCycle {
  id: number;
  name: string;
  scopeDepartmentId: number | null;
  location: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: 'Open' | 'Closed';
  assignedAuditors: number[];
  _count?: {
    auditItems: number;
  };
}

interface ScopedAsset {
  id: number;
  name: string;
  assetTag: string;
  serialNumber: string;
  location: string;
  status: string;
  currentDepartment: { id: number; name: string } | null;
  currentHolder: { id: number; name: string; email: string } | null;
}

interface AuditItem {
  id: number;
  auditCycleId: number;
  assetId: number;
  result: 'Verified' | 'Missing' | 'Damaged';
  notes: string | null;
  auditorId: number;
  auditor: {
    id: number;
    name: string;
    email: string;
  };
}

interface Department {
  id: number;
  name: string;
  status: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function Audits() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected active cycle details
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<AuditCycle | null>(null);
  const [scopedAssets, setScopedAssets] = useState<ScopedAsset[]>([]);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // New Cycle form state
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newScopeDeptId, setNewScopeDeptId] = useState<number | ''>('');
  const [newLocation, setNewLocation] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newAssignedAuditors, setNewAssignedAuditors] = useState<number[]>([]);
  const [isFormSubmitLoading, setIsFormSubmitLoading] = useState(false);

  // Log Item Form State
  const [loggingAsset, setLoggingAsset] = useState<ScopedAsset | null>(null);
  const [auditResult, setAuditResult] = useState<'Verified' | 'Missing' | 'Damaged'>('Verified');
  const [auditNotes, setAuditNotes] = useState('');
  const [isLogSubmitLoading, setIsLogSubmitLoading] = useState(false);

  // Discrepancy Report State
  const [reportCycleId, setReportCycleId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);


  const fetchCycles = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/audits');
      setCycles(response.data.cycles || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch audit cycles.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const deptsRes = await api.get('/departments');
      setDepartments((deptsRes.data.departments || []).filter((d: Department) => d.status === 'Active'));

      const empsRes = await api.get('/users');
      setEmployees((empsRes.data.users || []).filter((e: Employee) => e.status === 'Active'));
    } catch (err) {
      console.error('Failed to fetch setup data:', err);
    }
  };

  useEffect(() => {
    fetchCycles();
    fetchFiltersData();
  }, []);

  const fetchCycleDetails = async (cycleId: number) => {
    try {
      setIsDetailsLoading(true);
      setSelectedCycleId(cycleId);
      const response = await api.get(`/audits/${cycleId}`);
      setSelectedCycle(response.data.cycle);
      setScopedAssets(response.data.scopedAssets || []);
      setAuditItems(response.data.cycle?.auditItems || []);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load audit cycle details.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName.trim() || !newStartDate || !newEndDate || newAssignedAuditors.length === 0) {
      alert('Please fill out all required fields and assign at least one auditor.');
      return;
    }

    try {
      setIsFormSubmitLoading(true);
      await api.post('/audits', {
        name: newCycleName,
        scopeDepartmentId: newScopeDeptId ? Number(newScopeDeptId) : undefined,
        location: newLocation || undefined,
        dateRangeStart: newStartDate,
        dateRangeEnd: newEndDate,
        assignedAuditors: newAssignedAuditors
      });

      setNewCycleName('');
      setNewScopeDeptId('');
      setNewLocation('');
      setNewStartDate('');
      setNewEndDate('');
      setNewAssignedAuditors([]);
      setIsNewCycleOpen(false);

      fetchCycles();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create audit cycle.');
    } finally {
      setIsFormSubmitLoading(false);
    }
  };

  const handleLogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !loggingAsset) return;

    try {
      setIsLogSubmitLoading(true);
      await api.post(`/audits/${selectedCycleId}/items`, {
        assetId: loggingAsset.id,
        result: auditResult,
        notes: auditNotes
      });

      setLoggingAsset(null);
      setAuditNotes('');
      setAuditResult('Verified');

      // Refresh details
      fetchCycleDetails(selectedCycleId);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit audit result.');
    } finally {
      setIsLogSubmitLoading(false);
    }
  };
  const handleViewDiscrepancies = async (cycleId: number) => {
    try {
      setReportCycleId(cycleId);
      const response = await api.get(`/audits/${cycleId}/discrepancies`);
      setReportData(response.data);
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate discrepancy report.');
    }
  };

  const handleCloseCycle = async (cycleId: number) => {
    if (!confirm('Are you sure you want to CLOSE this audit cycle? Closing is irreversible. Scoped assets marked "Missing" will be transactionally status-updated to "Lost".')) return;

    try {
      await api.post(`/audits/${cycleId}/close`);
      alert('Audit cycle closed successfully.');
      setReportCycleId(null);
      setReportData(null);
      if (selectedCycleId === cycleId) {
        setSelectedCycleId(null);
        setSelectedCycle(null);
      }
      fetchCycles();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to close audit cycle.');
    }
  };

  const handleAuditorCheckboxChange = (empId: number) => {
    setNewAssignedAuditors(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const getAuditResultTextClass = (res: string) => {
    switch (res) {
      case 'Verified':
        return 'text-success font-semibold';
      case 'Missing':
        return 'text-danger font-semibold';
      case 'Damaged':
        return 'text-alert font-semibold';
      default:
        return 'text-text-secondary';
    }
  };

  const isManager = user?.role === 'Admin' || user?.role === 'AssetManager';

  return (
    <div className="space-y-24">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Asset Auditing</h1>
          <p className="text-sm text-text-secondary mt-4">
            Perform physical counts, log asset verification statuses, and generate discrepancy records.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsNewCycleOpen(true)}
            className="px-16 py-8 rounded-sm bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-8 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/15"
          >
            <Plus className="w-16 h-16" />
            <span>Create Audit Cycle</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-16 rounded border border-danger/20 bg-danger-subtle text-danger text-xs font-medium flex items-center gap-8">
          <AlertTriangle className="w-16 h-16 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Left Side: Audit Cycles List */}
        <div className={`space-y-16 ${selectedCycleId ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
          <div className="p-16 bg-surface border border-border rounded-md space-y-12">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Audit Cycles</h3>

            {isLoading ? (
              <div className="p-24 text-center text-xs text-text-secondary flex justify-center items-center gap-8">
                <Loader2 className="w-16 h-16 animate-spin text-accent" />
                <span>Loading cycles...</span>
              </div>
            ) : cycles.length === 0 ? (
              <div className="p-24 text-center text-xs text-text-muted italic">
                No audit cycles registered yet.
              </div>
            ) : (
              <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4">
                {cycles.map((c) => {
                  const isSelected = selectedCycleId === c.id;

                  return (
                    <div 
                      key={c.id} 
                      className={`p-12 rounded border transition-all cursor-pointer flex flex-col gap-6 ${
                        isSelected 
                          ? 'border-accent bg-accent-subtle/30 shadow-xs' 
                          : 'border-border bg-surface hover:border-border-strong hover:bg-neutral-subtle/20'
                      }`}
                      onClick={() => fetchCycleDetails(c.id)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-text-primary truncate">{c.name}</span>
                        <span className={`px-8 py-2 rounded-full border text-[9px] font-bold ${
                          c.status === 'Open' 
                            ? 'bg-success-subtle text-success border-success/10' 
                            : 'bg-neutral-subtle text-text-muted border-border'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2 text-[10px] text-text-secondary">
                        <div className="flex items-center gap-4">
                          <Calendar className="w-12 h-12 text-text-muted" />
                          <span>
                            {new Date(c.dateRangeStart).toLocaleDateString()} - {new Date(c.dateRangeEnd).toLocaleDateString()}
                          </span>
                        </div>
                        {c.scopeDepartmentId && (
                          <div className="flex items-center gap-4">
                            <Building className="w-12 h-12 text-text-muted" />
                            <span>Dept Head Scope</span>
                          </div>
                        )}
                        {c.location && (
                          <div className="flex items-center gap-4">
                            <MapPin className="w-12 h-12 text-text-muted" />
                            <span>Location: {c.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Admin Report buttons */}
                      {isManager && (
                        <div className="flex gap-8 pt-8 border-t border-border/60 mt-4 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDiscrepancies(c.id);
                            }}
                            className="px-8 py-4 rounded-sm border border-border text-[9px] font-semibold text-text-primary bg-surface hover:bg-neutral-subtle"
                          >
                            Discrepancies
                          </button>
                          {c.status === 'Open' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseCycle(c.id);
                              }}
                              className="px-8 py-4 rounded-sm bg-danger text-white text-[9px] font-semibold hover:bg-danger/90"
                            >
                              Close Cycle
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Auditing Scoped Assets Panel */}
        {selectedCycleId && (
          <div className="lg:col-span-8 space-y-16">
            <div className="p-24 bg-surface border border-border rounded-md space-y-16">
              {/* Header Info */}
              <div className="flex justify-between items-center border-b border-border pb-16">
                <div>
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-8">
                    <ClipboardCheck className="w-18 h-18 text-accent" />
                    <span>Audit Workspace: {selectedCycle?.name}</span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-2">
                    Mark scoped assets as verified, damaged, or missing. Status changes apply on cycle closure.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCycleId(null);
                    setSelectedCycle(null);
                  }}
                  className="text-xs text-text-muted hover:text-text-primary font-semibold"
                >
                  Close Panel
                </button>
              </div>

              {isDetailsLoading ? (
                <div className="p-48 text-center text-xs text-text-secondary flex justify-center items-center gap-8">
                  <Loader2 className="w-16 h-16 animate-spin text-accent" />
                  <span>Loading scoped assets...</span>
                </div>
              ) : scopedAssets.length === 0 ? (
                <div className="p-32 text-center text-xs text-text-muted italic bg-[#F7F8FA] rounded">
                  No assets match this cycle's scope department or location criteria.
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Progress Indicator */}
                  <div className="p-12 rounded border border-border bg-[#F7F8FA] space-y-8">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-text-secondary">Inspection Progress</span>
                      <span className="text-text-primary">
                        {auditItems.length} of {scopedAssets.length} verified ({Math.round((auditItems.length / scopedAssets.length) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-8 overflow-hidden">
                      <div 
                        className="bg-accent h-full transition-all duration-300"
                        style={{ width: `${(auditItems.length / scopedAssets.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Scoped Assets Table */}
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F7F8FA] border-b border-border text-text-secondary font-bold select-none">
                          <th className="py-10 px-12">Asset</th>
                          <th className="py-10 px-12">Location</th>
                          <th className="py-10 px-12">Current Holder</th>
                          <th className="py-10 px-12">Audited State</th>
                          <th className="py-10 px-12 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-sans text-text-primary">
                        {scopedAssets.map((asset) => {
                          // Find if audited
                          const log = auditItems.find(item => item.assetId === asset.id);
                          const isClosed = selectedCycle?.status === 'Closed';
                          return (
                            <tr key={asset.id} className="hover:bg-neutral-subtle/40 transition-colors">
                              <td className="py-10 px-12">
                                <div className="font-semibold text-text-primary">{asset.name}</div>
                                <div className="text-[10px] text-text-muted font-mono">{asset.assetTag} · {asset.serialNumber}</div>
                              </td>
                              <td className="py-10 px-12 text-text-secondary font-medium">{asset.location}</td>
                              <td className="py-10 px-12">
                                {asset.currentHolder ? (
                                  <span className="text-text-primary font-semibold">{asset.currentHolder.name}</span>
                                ) : (
                                  <span className="text-text-muted italic">Unallocated</span>
                                )}
                              </td>
                              <td className="py-10 px-12">
                                {log ? (
                                  <div className="space-y-2">
                                    <span className={getAuditResultTextClass(log.result)}>
                                      {log.result}
                                    </span>
                                    {log.notes && (
                                      <div className="text-[10px] text-text-muted truncate max-w-[150px]" title={log.notes}>
                                        "{log.notes}"
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-text-muted italic">Awaiting audit</span>
                                )}
                              </td>
                              <td className="py-10 px-12 text-right">
                                {isClosed ? (
                                  <span className="text-[10px] text-text-muted italic select-none">Cycle Closed</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setLoggingAsset(asset);
                                      setAuditResult(log ? log.result : 'Verified');
                                      setAuditNotes(log?.notes || '');
                                    }}
                                    className="px-10 py-6 rounded-sm bg-accent hover:bg-accent-hover text-white text-[10px] font-semibold"
                                  >
                                    {log ? 'Re-audit' : 'Verify'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Audit Cycle */}
      {isNewCycleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div 
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs"
            onClick={() => setIsNewCycleOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg bg-surface border border-border rounded shadow-xl overflow-hidden animate-fade-in">
            <div className="px-24 py-16 border-b border-border flex justify-between items-center bg-[#F7F8FA]">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-8">
                <ClipboardCheck className="w-16 h-16 text-accent" />
                <span>Create Audit Cycle</span>
              </h3>
              <button
                onClick={() => setIsNewCycleOpen(false)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold focus:outline-none"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="p-24 space-y-16 max-h-[80vh] overflow-y-auto">
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Electronics Physical Inventory"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <label className="text-xs font-semibold text-text-secondary block">Scope Department (Optional)</label>
                  <select
                    value={newScopeDeptId}
                    onChange={(e) => setNewScopeDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                  >
                    <option value="">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-semibold text-text-secondary block">Location Filter (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SF Headquarters"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <label className="text-xs font-semibold text-text-secondary block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-semibold text-text-secondary block">End Date</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Auditors Selection List */}
              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Assign Auditors (Required)</label>
                <div className="border border-border rounded p-12 space-y-6 max-h-[150px] overflow-y-auto bg-surface-sunken">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-8 text-xs font-medium text-text-primary cursor-pointer hover:bg-neutral-subtle/50 p-4 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={newAssignedAuditors.includes(emp.id)}
                        onChange={() => handleAuditorCheckboxChange(emp.id)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{emp.name} ({emp.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-12 pt-8">
                <button
                  type="button"
                  onClick={() => setIsNewCycleOpen(false)}
                  className="px-16 py-8 border border-border hover:bg-neutral-subtle rounded-sm text-text-primary text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitLoading}
                  className="px-16 py-8 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold flex items-center gap-6 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isFormSubmitLoading && <Loader2 className="w-14 h-14 animate-spin" />}
                  <span>Create Cycle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Asset Verification */}
      {loggingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div 
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs"
            onClick={() => setLoggingAsset(null)}
          ></div>

          <div className="relative w-full max-w-md bg-surface border border-border rounded shadow-xl overflow-hidden animate-fade-in">
            <div className="px-24 py-16 border-b border-border flex justify-between items-center bg-[#F7F8FA]">
              <h3 className="text-sm font-bold text-text-primary">
                Verify Scoped Asset: {loggingAsset.name}
              </h3>
              <button
                onClick={() => setLoggingAsset(null)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold focus:outline-none"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleLogItem} className="p-24 space-y-16">
              <div className="p-8 rounded bg-surface-sunken border border-border text-[11px] text-text-secondary space-y-2">
                <div>Tag: <span className="font-mono font-semibold text-text-primary">{loggingAsset.assetTag}</span></div>
                <div>Serial: <span className="font-mono font-semibold text-text-primary">{loggingAsset.serialNumber}</span></div>
                <div>Location: <span className="font-semibold text-text-primary">{loggingAsset.location}</span></div>
              </div>

              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Audit Result</label>
                <div className="grid grid-cols-3 gap-8">
                  {['Verified', 'Missing', 'Damaged'].map((resOption) => {
                    const isSelected = auditResult === resOption;
                    let colorTheme = 'bg-accent text-white border-accent';
                    if (resOption === 'Missing') colorTheme = 'bg-danger text-white border-danger';
                    if (resOption === 'Damaged') colorTheme = 'bg-alert text-white border-alert';
                    
                    return (
                      <button
                        key={resOption}
                        type="button"
                        onClick={() => setAuditResult(resOption as any)}
                        className={`py-8 text-xs font-semibold rounded border text-center transition-all ${
                          isSelected 
                            ? colorTheme 
                            : 'bg-surface border-border hover:bg-neutral-subtle text-text-secondary'
                        }`}
                      >
                        {resOption}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-xs font-semibold text-text-secondary block">Inspection Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g. Scratches on front bezel, or item was not in SF cabinet..."
                  className="w-full bg-surface border border-border rounded-md px-12 py-8 text-xs text-text-primary font-sans focus:outline-none focus:border-accent resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-12 pt-8">
                <button
                  type="button"
                  onClick={() => setLoggingAsset(null)}
                  className="px-16 py-8 border border-border hover:bg-neutral-subtle rounded-sm text-text-primary text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLogSubmitLoading}
                  className="px-16 py-8 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                >
                  {isLogSubmitLoading && <Loader2 className="w-14 h-14 animate-spin inline mr-6" />}
                  <span>Save Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Discrepancy Report */}
      {reportCycleId && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div 
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs"
            onClick={() => {
              setReportCycleId(null);
              setReportData(null);
            }}
          ></div>

          <div className="relative w-full max-w-3xl bg-surface border border-border rounded shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
            <div className="px-24 py-16 border-b border-border flex justify-between items-center bg-[#F7F8FA] shrink-0">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-8">
                <ShieldAlert className="w-16 h-16 text-danger" />
                <span>Discrepancy Report</span>
              </h3>
              <button
                onClick={() => {
                  setReportCycleId(null);
                  setReportData(null);
                }}
                className="text-text-muted hover:text-text-primary text-xs font-semibold focus:outline-none"
              >
                Close Report
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-24 space-y-24 overflow-y-auto flex-1">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
                <div className="p-12 border border-border rounded bg-surface-sunken">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Scoped Assets</div>
                  <div className="text-lg font-bold text-text-primary mt-4">{reportData.summary.totalScoped}</div>
                </div>
                <div className="p-12 border border-border rounded bg-surface-sunken">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Verified Count</div>
                  <div className="text-lg font-bold text-success mt-4">{reportData.summary.verifiedCount}</div>
                </div>
                <div className="p-12 border border-border rounded bg-surface-sunken">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Missing Count</div>
                  <div className="text-lg font-bold text-danger mt-4">{reportData.summary.missingCount}</div>
                </div>
                <div className="p-12 border border-border rounded bg-surface-sunken">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Pending Count</div>
                  <div className="text-lg font-bold text-warning mt-4">{reportData.summary.pendingCount}</div>
                </div>
              </div>

              {/* Categorized Issues */}
              <div className="space-y-16">
                {/* Missing section */}
                <div className="space-y-8">
                  <h4 className="text-xs font-bold text-danger flex items-center gap-6 border-b border-border pb-4">
                    <XCircle className="w-14 h-14" />
                    <span>Missing Assets ({reportData.discrepancies.missing.length})</span>
                  </h4>
                  {reportData.discrepancies.missing.length === 0 ? (
                    <div className="text-xs text-text-muted italic p-8">No assets marked missing.</div>
                  ) : (
                    <div className="border border-border rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <tr className="bg-[#F7F8FA] border-b border-border font-bold">
                          <th className="py-6 px-12">Asset Tag</th>
                          <th className="py-6 px-12">Name</th>
                          <th className="py-6 px-12">Auditor Notes</th>
                        </tr>
                        {reportData.discrepancies.missing.map((item: any) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-6 px-12 font-mono font-semibold">{item.asset.assetTag}</td>
                            <td className="py-6 px-12 font-semibold text-text-primary">{item.asset.name}</td>
                            <td className="py-6 px-12 text-text-secondary italic">"{item.notes || 'No description provided'}"</td>
                          </tr>
                        ))}
                      </table>
                    </div>
                  )}
                </div>

                {/* Damaged section */}
                <div className="space-y-8 mt-16">
                  <h4 className="text-xs font-bold text-alert flex items-center gap-6 border-b border-border pb-4">
                    <AlertTriangle className="w-14 h-14" />
                    <span>Damaged Assets ({reportData.discrepancies.damaged.length})</span>
                  </h4>
                  {reportData.discrepancies.damaged.length === 0 ? (
                    <div className="text-xs text-text-muted italic p-8">No assets marked damaged.</div>
                  ) : (
                    <div className="border border-border rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <tr className="bg-[#F7F8FA] border-b border-border font-bold">
                          <th className="py-6 px-12">Asset Tag</th>
                          <th className="py-6 px-12">Name</th>
                          <th className="py-6 px-12">Auditor Notes</th>
                        </tr>
                        {reportData.discrepancies.damaged.map((item: any) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-6 px-12 font-mono font-semibold">{item.asset.assetTag}</td>
                            <td className="py-6 px-12 font-semibold text-text-primary">{item.asset.name}</td>
                            <td className="py-6 px-12 text-text-secondary italic">"{item.notes || 'No description provided'}"</td>
                          </tr>
                        ))}
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky footer with Close actions */}
            {isManager && reportData.summary.pendingCount === 0 && (
              <div className="px-24 py-16 bg-[#F7F8FA] border-t border-border flex justify-between items-center shrink-0">
                <span className="text-[10px] text-text-secondary font-medium">All scoped assets have been audited.</span>
                <button
                  type="button"
                  onClick={() => handleCloseCycle(reportCycleId)}
                  className="px-16 py-8 bg-danger hover:bg-danger/90 text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                >
                  Close Cycle & Flag Missing Lost
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
