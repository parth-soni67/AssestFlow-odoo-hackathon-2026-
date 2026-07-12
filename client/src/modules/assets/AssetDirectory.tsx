import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Search, Plus, Calendar, ShieldCheck, MapPin, Tag } from 'lucide-react';

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
  category: { id: number; name: string };
  currentDepartment?: { id: number; name: string } | null;
  currentHolder?: { id: number; name: string; email: string } | null;
}

interface Category {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

export default function AssetDirectory() {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'AssetManager';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterBookable, setFilterBookable] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Asset Form
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    serialNumber: '',
    qrCode: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    condition: 'New',
    location: '',
    isBookable: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Build filters query
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('categoryId', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDept) params.append('departmentId', filterDept);
      if (filterBookable) params.append('isBookable', filterBookable);

      const assetsRes = await api.get(`/assets?${params.toString()}`);
      setAssets(assetsRes.data.assets || []);

      const catsRes = await api.get('/categories');
      setCategories(catsRes.data.categories || []);

      const deptsRes = await api.get('/departments');
      setDepartments(deptsRes.data.departments || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterCategory, filterStatus, filterDept, filterBookable]);

  // Alert Timers
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.serialNumber || !form.acquisitionCost || !form.location) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        ...form,
        categoryId: parseInt(form.categoryId, 10),
        acquisitionCost: parseFloat(form.acquisitionCost),
        qrCode: form.qrCode.trim() || null,
      };

      await api.post('/assets', payload);
      setSuccess('Asset registered successfully.');
      setModalOpen(false);
      // Reset form
      setForm({
        name: '',
        categoryId: '',
        serialNumber: '',
        qrCode: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: '',
        condition: 'New',
        location: '',
        isBookable: false,
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register asset.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in" style={{ color: 'var(--color-text-primary)' }}>
      {/* Alert Notices */}
      {error && (
        <div className="px-4 py-3 border rounded text-xs font-semibold" style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 border rounded text-xs font-semibold" style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
          {success}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Assets Directory</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Manage, track, and filter all company assets and shared equipment.</p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--color-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
        )}
      </div>

      {/* Filter Controls — single compact row */}
      <div className="flex flex-col md:flex-row gap-2 p-3 rounded-lg border" style={{ background: 'var(--color-surface-sunken)', borderColor: 'var(--color-border)' }}>
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by tag, name, serial, location…"
            className="w-full h-9 pl-9 pr-3 rounded-md border text-sm focus:outline-none"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2">
          {([
            { value: filterCategory, onChange: setFilterCategory, options: [['', 'All Categories'], ...categories.map(c => [String(c.id), c.name])] },
            { value: filterStatus,   onChange: setFilterStatus,   options: [['', 'All Statuses'], ['Available','Available'], ['Allocated','Allocated'], ['Reserved','Reserved'], ['UnderMaintenance','Under Maintenance'], ['Lost','Lost'], ['Retired','Retired'], ['Disposed','Disposed']] },
            { value: filterDept,     onChange: setFilterDept,     options: [['', 'All Departments'], ...departments.map(d => [String(d.id), d.name])] },
            { value: filterBookable, onChange: setFilterBookable, options: [['', 'Booking: All'], ['true','Bookable'], ['false','Non-Bookable']] },
          ] as Array<{ value: string; onChange: (v: string) => void; options: [string, string][] }>).map((f, i) => (
            <select
              key={i}
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              className="h-9 px-3 rounded-md border text-sm focus:outline-none"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
            >
              {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Asset Cards Grid */}
      {loading && assets.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading assets…</div>
      ) : assets.length === 0 ? (
        <div className="py-16 text-center text-sm rounded-lg border" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          No assets match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col rounded-lg border overflow-hidden"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
            >
              {/* Card Body */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium px-2 py-1 rounded border" style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                    <Tag className="w-3 h-3" />
                    {asset.assetTag}
                  </span>
                  <span className={`text-xs px-2 py-0.5 font-semibold rounded-full border ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{asset.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{asset.category.name}</p>
                </div>

                <div className="flex flex-col gap-1.5 pt-3 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span>Acquired {new Date(asset.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span>Condition: <strong style={{ color: 'var(--color-text-primary)' }}>{asset.condition}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto flex items-center justify-between px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-sunken)' }}>
                {asset.isBookable ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>Bookable</span>
                ) : <span />}
                <Link
                  to={`/assets/${asset.id}`}
                  className="text-xs font-semibold transition-colors"
                  style={{ color: 'var(--color-accent)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Asset Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-[500px] rounded-lg border shadow-[0_8px_24px_0_rgba(0,0,0,0.12)] animate-scale-up max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Register New Asset</h3>
              <button onClick={() => setModalOpen(false)} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Asset Name *</label>
                <input type="text" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} placeholder="e.g. MacBook Pro M3 Max" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Category *</label>
                  <select className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Serial Number *</label>
                  <input type="text" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} placeholder="e.g. C02X874K" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Acquisition Date *</label>
                  <input type="date" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Cost (USD) *</label>
                  <input type="number" step="0.01" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} placeholder="e.g. 2499.00" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Condition *</label>
                  <select className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} required>
                    <option>New</option><option>Good</option><option>Fair</option><option>Damaged</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Location *</label>
                  <input type="text" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} placeholder="e.g. Office Desk 12A" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>QR / Barcode (Optional)</label>
                <input type="text" className="h-9 px-3 rounded-md border text-sm focus:outline-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} placeholder="e.g. AF-QR-0418" value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="isBookable" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Allow booking reservations (shared resource)</span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-md border text-sm font-medium transition-colors" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}>Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
