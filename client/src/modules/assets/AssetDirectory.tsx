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
      case 'Available': return 'bg-[#E6F6EE] text-[#1E8E5A] border-[#1E8E5A]/25';
      case 'Allocated': return 'bg-[#EBF3FC] text-[#2F5DE0] border-[#2F5DE0]/25';
      case 'Reserved': return 'bg-[#FFF9E6] text-[#B78103] border-[#B78103]/25';
      case 'UnderMaintenance': return 'bg-[#F2F4F7] text-[#5B6270] border-[#5B6270]/25';
      case 'Lost': return 'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25';
      default: return 'bg-[#FBEAE9] text-[#C1352E] border-[#C1352E]/25';
    }
  };

  return (
    <div className="space-y-24 font-sans text-[#1A1D23]">
      {/* Alert Notices */}
      {error && (
        <div className="p-16 border border-[#C1352E] bg-[#FBEAE9] text-[#C1352E] text-sm rounded-[6px]">
          {error}
        </div>
      )}
      {success && (
        <div className="p-16 border border-[#1E8E5A] bg-[#E6F6EE] text-[#1E8E5A] text-sm rounded-[6px]">
          {success}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 border-b border-[#DDE1E6] pb-16">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1A1D23]">Assets Directory</h1>
          <p className="text-xs text-[#5B6270]">Manage, track, and filter all company assets and shared equipment.</p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-8 bg-[#2F5DE0] hover:bg-[#274CBD] text-white text-xs font-semibold px-16 py-8 rounded-[6px] shadow-sm transition-colors"
          >
            <Plus className="w-16 h-16" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-16 bg-[#F7F8FA] border border-[#DDE1E6] rounded-[6px] flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:flex-1 relative">
          <Search className="w-16 h-16 absolute left-12 top-10 text-[#C4C9D1]" />
          <input
            type="text"
            placeholder="Search by tag, name, serial, location..."
            className="w-full h-36 pl-36 pr-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23] focus:border-[#2F5DE0] focus:ring-2 focus:ring-[#2F5DE0]/10 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap gap-12">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-36 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-36 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Reserved">Reserved</option>
            <option value="UnderMaintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
            <option value="Disposed">Disposed</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-36 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270] focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterBookable}
            onChange={(e) => setFilterBookable(e.target.value)}
            className="h-36 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270] focus:outline-none"
          >
            <option value="">All Booking Rights</option>
            <option value="true">Bookable Items</option>
            <option value="false">Non-Bookable Items</option>
          </select>
        </div>
      </div>

      {/* Asset Cards Grid */}
      {loading && assets.length === 0 ? (
        <div className="text-center py-48 text-[#5B6270] text-xs">Loading directory...</div>
      ) : assets.length === 0 ? (
        <div className="bg-white border border-[#DDE1E6] rounded-[6px] p-48 text-center text-[#5B6270] text-xs">
          No assets found matching the chosen search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-24">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white border border-[#DDE1E6] hover:border-[#2F5DE0]/35 rounded-[6px] overflow-hidden shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              {/* Card Body */}
              <div className="p-20 space-y-16">
                <div className="flex items-start justify-between gap-12">
                  <span className="font-mono text-xs font-semibold text-[#5B6270] bg-[#F7F8FA] px-8 py-4 border border-[#DDE1E6] rounded-[4px] flex items-center gap-4">
                    <Tag className="w-12 h-12 text-[#5B6270]" />
                    {asset.assetTag}
                  </span>
                  <span className={`text-[10px] px-8 py-2 font-bold rounded-full border ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#1A1D23] truncate">{asset.name}</h3>
                  <p className="text-[11px] text-[#5B6270]">{asset.category.name}</p>
                </div>

                <div className="space-y-8 pt-8 border-t border-[#F7F8FA] text-xs text-[#5B6270]">
                  <div className="flex items-center gap-8">
                    <MapPin className="w-14 h-14 text-[#C4C9D1]" />
                    <span className="truncate">{asset.location}</span>
                  </div>

                  <div className="flex items-center gap-8">
                    <Calendar className="w-14 h-14 text-[#C4C9D1]" />
                    <span>Acquired: {new Date(asset.acquisitionDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-8">
                    <ShieldCheck className="w-14 h-14 text-[#C4C9D1]" />
                    <span>Condition: <strong className="text-[#1A1D23]">{asset.condition}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-[#F7F8FA] border-t border-[#DDE1E6] px-20 py-12 flex items-center justify-between text-xs">
                <div>
                  {asset.isBookable && (
                    <span className="bg-[#EBF3FC] text-[#2F5DE0] text-[10px] px-8 py-2 rounded font-semibold">
                      Bookable
                    </span>
                  )}
                </div>
                <Link
                  to={`/assets/${asset.id}`}
                  className="text-[#2F5DE0] hover:text-[#274CBD] font-bold text-xs"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- REGISTER ASSET MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#1A1D23]/35 flex items-center justify-center z-50 p-16 animate-fade-in">
          <div className="w-full max-w-[500px] p-24 bg-white border border-[#DDE1E6] rounded-[6px] space-y-24 shadow-lg animate-scale-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-md font-bold text-[#1A1D23] border-b border-[#DDE1E6] pb-8">
              Register New Asset
            </h3>

            <form onSubmit={handleCreateAsset} className="space-y-16">
              <div className="space-y-8">
                <label className="block text-xs font-semibold text-[#5B6270]">Asset Name *</label>
                <input
                  type="text"
                  className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                  placeholder="e.g. MacBook Pro M3 Max"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Category *</label>
                  <select
                    className="w-full h-32 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270]"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Serial Number *</label>
                  <input
                    type="text"
                    className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                    placeholder="e.g. C02X874K"
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Acquisition Date *</label>
                  <input
                    type="date"
                    className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                    value={form.acquisitionDate}
                    onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Acquisition Cost (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                    placeholder="e.g. 2499.00"
                    value={form.acquisitionCost}
                    onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Condition *</label>
                  <select
                    className="w-full h-32 px-8 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270]"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    required
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="space-y-8">
                  <label className="block text-xs font-semibold text-[#5B6270]">Location / Desk *</label>
                  <input
                    type="text"
                    className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                    placeholder="e.g. Office Desk 12A"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-8">
                <label className="block text-xs font-semibold text-[#5B6270]">QR / Barcode Stub (Optional)</label>
                <input
                  type="text"
                  className="w-full h-32 px-12 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                  placeholder="e.g. AF-QR-0418"
                  value={form.qrCode}
                  onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-8 select-none">
                <input
                  type="checkbox"
                  id="isBookable"
                  checked={form.isBookable}
                  onChange={(e) => setForm({ ...form, isBookable: e.target.checked })}
                />
                <label htmlFor="isBookable" className="text-xs font-semibold text-[#5B6270]">
                  Allow Employee Booking Reservations (Shared Resource)
                </label>
              </div>

              <div className="flex justify-end gap-12 pt-16 border-t border-[#DDE1E6]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#DDE1E6] hover:bg-[#F7F8FA] text-[#5B6270] text-xs font-semibold px-16 py-8 rounded-[6px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#2F5DE0] hover:bg-[#274CBD] text-white text-xs font-semibold px-16 py-8 rounded-[6px] transition-colors disabled:opacity-50"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
