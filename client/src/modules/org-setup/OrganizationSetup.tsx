import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Department {
  id: number;
  name: string;
  parentDepartmentId: number | null;
  departmentHeadId: number | null;
  status: 'Active' | 'Inactive';
  parentDepartment?: { id: number; name: string } | null;
  departmentHead?: { id: number; name: string; email: string } | null;
  _count?: { employees: number; assets: number; subDepartments: number };
}

interface CustomFieldDef {
  name: string;
  type: 'text' | 'number' | 'boolean';
  required: boolean;
}

interface AssetCategory {
  id: number;
  name: string;
  customFields: CustomFieldDef[] | null;
  _count?: { assets: number };
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin';
  status: 'Active' | 'Inactive';
  departmentId: number | null;
  department?: { id: number; name: string } | null;
}

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments');

  // List States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter States (Employees)
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Department Modal States
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    parentDepartmentId: '',
    departmentHeadId: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Category Modal States
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');
  const [catFields, setCatFields] = useState<CustomFieldDef[]>([]);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const deptsRes = await api.get('/departments');
      setDepartments(deptsRes.data.departments || []);

      const catsRes = await api.get('/categories');
      setCategories(catsRes.data.categories || []);

      // Load employees (default unfiltered, controller handles this)
      let queryStr = '';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      if (filterDept) params.append('departmentId', filterDept);
      if (filterStatus) params.append('status', filterStatus);
      if (params.toString()) queryStr = `?${params.toString()}`;

      const empsRes = await api.get(`/users${queryStr}`);
      setEmployees(empsRes.data.users || []);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to fetch setup data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, search, filterRole, filterDept, filterStatus]);

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

  // --- Department CRUD Handlers ---
  const handleOpenDeptCreate = () => {
    setEditingDeptId(null);
    setDeptForm({ name: '', parentDepartmentId: '', departmentHeadId: '', status: 'Active' });
    setDeptModalOpen(true);
  };

  const handleOpenDeptEdit = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptForm({
      name: dept.name,
      parentDepartmentId: dept.parentDepartmentId?.toString() || '',
      departmentHeadId: dept.departmentHeadId?.toString() || '',
      status: dept.status,
    });
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) return;

    try {
      setLoading(true);
      const payload = {
        name: deptForm.name,
        parentDepartmentId: deptForm.parentDepartmentId ? parseInt(deptForm.parentDepartmentId, 10) : null,
        departmentHeadId: deptForm.departmentHeadId ? parseInt(deptForm.departmentHeadId, 10) : null,
        status: deptForm.status,
      };

      if (editingDeptId) {
        await api.put(`/departments/${editingDeptId}`, payload);
        setSuccess('Department updated successfully.');
      } else {
        await api.post('/departments', payload);
        setSuccess('Department created successfully.');
      }
      setDeptModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save department.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      setLoading(true);
      await api.delete(`/departments/${id}`);
      setSuccess('Department deleted successfully.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete department.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeptStatus = async (dept: Department) => {
    try {
      setLoading(true);
      const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/departments/${dept.id}`, { status: newStatus });
      setSuccess(`Department marked as ${newStatus}.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to toggle status.');
    } finally {
      setLoading(false);
    }
  };

  // --- Category CRUD Handlers ---
  const handleOpenCatCreate = () => {
    setEditingCatId(null);
    setCatName('');
    setCatFields([]);
    setCatModalOpen(true);
  };

  const handleOpenCatEdit = (cat: AssetCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatFields(cat.customFields || []);
    setCatModalOpen(true);
  };

  const handleAddField = () => {
    setCatFields([...catFields, { name: '', type: 'text', required: false }]);
  };

  const handleFieldChange = (index: number, key: keyof CustomFieldDef, value: any) => {
    const updated = [...catFields];
    updated[index] = { ...updated[index], [key]: value };
    setCatFields(updated);
  };

  const handleRemoveField = (index: number) => {
    setCatFields(catFields.filter((_, i) => i !== index));
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      setLoading(true);
      const payload = {
        name: catName,
        customFields: catFields.filter(f => f.name.trim() !== ''),
      };

      if (editingCatId) {
        await api.put(`/categories/${editingCatId}`, payload);
        setSuccess('Asset category updated successfully.');
      } else {
        await api.post('/categories', payload);
        setSuccess('Asset category created successfully.');
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setLoading(true);
      await api.delete(`/categories/${id}`);
      setSuccess('Category deleted successfully.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete category.');
    } finally {
      setLoading(false);
    }
  };

  // --- Employee Directory Promotion Handlers ---
  const handlePromoteRole = async (userId: number, newRole: string) => {
    try {
      setLoading(true);
      await api.put(`/users/${userId}/role`, { role: newRole });
      setSuccess('User role updated successfully.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update user role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-text-primary">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 border border-danger/20 bg-danger-subtle text-danger text-xs font-semibold rounded-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 border border-success/20 bg-success-subtle text-success text-xs font-semibold rounded-sm">
          {success}
        </div>
      )}

      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('departments')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
              activeTab === 'departments' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Departments
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
              activeTab === 'categories' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Asset Categories
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={`pb-12 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
              activeTab === 'employees' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Employee Directory
          </button>
        </div>

        <div>
          {activeTab === 'departments' && (
            <button 
              onClick={handleOpenDeptCreate}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-sm transition-colors"
            >
              Add Department
            </button>
          )}
          {activeTab === 'categories' && (
            <button 
              onClick={handleOpenCatCreate}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-sm transition-colors"
            >
              Add Asset Category
            </button>
          )}
        </div>
      </div>

      {/* Tab Panel Content */}
      <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
        {/* --- DEPARTMENTS TAB --- */}
        {activeTab === 'departments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-border text-xs font-semibold text-text-secondary">
                  <th className="p-4">Department Name</th>
                  <th className="p-4">Parent Hierarchy</th>
                  <th className="p-4">Department Head</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Employees</th>
                  <th className="p-4 text-center">Assets</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#5B6270] text-xs">
                      No departments configured. Click Add Department to create one.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-[#F7F8FA]/50 transition-colors">
                      <td className="p-4 font-semibold">{dept.name}</td>
                      <td className="p-4 text-[#5B6270] text-xs">
                        {dept.parentDepartment?.name || <span className="text-[#C4C9D1]">—</span>}
                      </td>
                      <td className="p-4">
                        {dept.departmentHead ? (
                          <div className="text-xs">
                            <p className="font-medium">{dept.departmentHead.name}</p>
                            <p className="text-[#5B6270]">{dept.departmentHead.email}</p>
                          </div>
                        ) : (
                          <span className="text-[#C4C9D1] text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleDeptStatus(dept)}
                          className={`inline-block text-[11px] px-2 py-1 font-bold rounded-full select-none transition-colors border ${
                            dept.status === 'Active'
                              ? 'bg-success-subtle text-success border-success/35 hover:bg-success/10'
                              : 'bg-danger-subtle text-danger border-danger/35 hover:bg-danger/10'
                          }`}
                        >
                          {dept.status}
                        </button>
                      </td>
                      <td className="p-4 text-center text-[#5B6270] font-mono text-xs">
                        {dept._count?.employees || 0}
                      </td>
                      <td className="p-4 text-center text-[#5B6270] font-mono text-xs">
                        {dept._count?.assets || 0}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button 
                          onClick={() => handleOpenDeptEdit(dept)}
                          className="text-[#2F5DE0] hover:text-[#274CBD] text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteDept(dept.id)}
                          className="text-[#C1352E] hover:text-[#A12720] text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ASSET CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-border text-xs font-semibold text-text-secondary">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Dynamic Custom Fields</th>
                  <th className="p-4 text-center">Registered Assets</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-text-secondary text-xs">
                      No asset categories defined. Click Add Asset Category to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-neutral-subtle/20 transition-colors">
                      <td className="p-4 font-semibold">{cat.name}</td>
                      <td className="p-4">
                        {cat.customFields && cat.customFields.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {cat.customFields.map((field, idx) => (
                              <span 
                                key={idx} 
                                className="text-[11px] font-medium bg-surface-sunken border border-border px-2 py-0.5 rounded-sm text-text-secondary"
                              >
                                {field.name} ({field.type}){field.required && <span className="text-danger ml-0.5">*</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">None</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-text-secondary font-mono text-xs">
                        {cat._count?.assets || 0}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button 
                          onClick={() => handleOpenCatEdit(cat)}
                          className="text-[#2F5DE0] hover:text-[#274CBD] text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCat(cat.id)}
                          className="text-[#C1352E] hover:text-[#A12720] text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- EMPLOYEE DIRECTORY TAB --- */}
        {activeTab === 'employees' && (
          <div>
            {/* Filter Bar */}
            <div className="p-4 bg-[#F7F8FA] border-b border-border flex flex-col md:flex-row gap-3 items-center">
              <div className="w-full md:flex-1">
                <input 
                  type="text" 
                  placeholder="Search name or email..."
                  className="w-full h-8 px-3 border border-border rounded bg-surface text-xs text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto flex flex-wrap gap-3">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="h-8 px-2 border border-border rounded bg-surface text-xs text-text-secondary focus:outline-none focus:border-accent"
                >
                  <option value="">All Roles</option>
                  <option value="Employee">Employee</option>
                  <option value="DepartmentHead">Department Head</option>
                  <option value="AssetManager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="h-8 px-2 border border-border rounded bg-surface text-xs text-text-secondary focus:outline-none focus:border-accent"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-8 px-2 border border-border rounded bg-surface text-xs text-text-secondary focus:outline-none focus:border-accent"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-border text-xs font-semibold text-text-secondary">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4 text-right">Promote / Demote Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-text-secondary text-xs">
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-neutral-subtle/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-28 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-bold text-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-xs">{emp.name}</p>
                              <p className="text-text-secondary text-[11px]">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {emp.department?.name || <span className="text-text-muted text-xs">—</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] px-2 py-0.5 font-bold rounded-full border ${
                            emp.status === 'Active'
                              ? 'bg-success-subtle text-success border-success/25'
                              : 'bg-danger-subtle text-danger border-danger/25'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs font-semibold text-text-secondary">
                          {emp.role}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={emp.role}
                            onChange={(e) => handlePromoteRole(emp.id, e.target.value)}
                            className="h-28 px-1 border border-border rounded-sm bg-surface text-xs text-text-secondary focus:outline-none focus:border-accent"
                          >
                            <option value="Employee">Employee</option>
                            <option value="DepartmentHead">Department Head</option>
                            <option value="AssetManager">Asset Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- DEPARTMENT MODAL --- */}
      {deptModalOpen && (
        <div className="fixed inset-0 bg-[#1A1D23]/35 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-[400px] p-6 bg-white border border-[#DDE1E6] rounded-[6px] space-y-6 shadow-lg animate-scale-up">
            <h3 className="text-md font-bold text-[#1A1D23] border-b border-[#DDE1E6] pb-2">
              {editingDeptId ? 'Edit Department' : 'Create Department'}
            </h3>

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#5B6270]">Department Name</label>
                <input 
                  type="text" 
                  className="w-full h-8 px-3 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#1A1D23]"
                  placeholder="e.g. engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#5B6270]">Parent Department</label>
                <select
                  className="w-full h-8 px-2 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270]"
                  value={deptForm.parentDepartmentId}
                  onChange={(e) => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter(d => d.id !== editingDeptId)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#5B6270]">Assign Department Head</label>
                <select
                  className="w-full h-8 px-2 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270]"
                  value={deptForm.departmentHeadId}
                  onChange={(e) => setDeptForm({ ...deptForm, departmentHeadId: e.target.value })}
                >
                  <option value="">None (Unassigned)</option>
                  {employees
                    .filter(emp => emp.role === 'DepartmentHead')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#5B6270]">Status</label>
                <select
                  className="w-full h-8 px-2 border border-[#DDE1E6] rounded-[6px] bg-white text-xs text-[#5B6270]"
                  value={deptForm.status}
                  onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value as 'Active' | 'Inactive' })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="border border-border hover:bg-neutral-subtle text-text-secondary text-xs font-semibold px-4 py-2 rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSET CATEGORY MODAL --- */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-text-primary/35 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-[500px] p-6 bg-surface border border-border rounded space-y-6 shadow-lg animate-scale-up">
            <h3 className="text-md font-bold text-text-primary border-b border-border pb-2">
              {editingCatId ? 'Edit Category' : 'Create Asset Category'}
            </h3>

            <form onSubmit={handleSaveCat} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">Category Name</label>
                <input 
                  type="text" 
                  className="w-full h-8 px-3 border border-border rounded bg-surface text-xs text-text-primary"
                  placeholder="e.g. Laptops, Vehicles"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <label className="text-xs font-semibold text-text-secondary">Custom Dynamic Fields</label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-accent hover:text-accent-hover text-[11px] font-bold"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {catFields.length === 0 ? (
                    <p className="text-[11px] text-text-muted text-center py-2">
                      No custom fields added yet. Add fields to collect extra data on items.
                    </p>
                  ) : (
                    catFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-[#F7F8FA] p-2 border border-border rounded-sm">
                        <input 
                          type="text" 
                          placeholder="Field name (e.g. RAM)"
                          className="flex-1 h-28 px-2 border border-border rounded-sm bg-surface text-xs text-text-primary"
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          required
                        />

                        <select
                          className="h-28 px-1 border border-border rounded-sm bg-surface text-xs text-text-secondary"
                          value={field.type}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                        >
                          <option value="text">text</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                        </select>

                        <label className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary select-none">
                          <input 
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                          />
                          Req
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(idx)}
                          className="text-danger hover:text-danger/95 text-xs font-semibold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="border border-border hover:bg-neutral-subtle text-text-secondary text-xs font-semibold px-4 py-2 rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
