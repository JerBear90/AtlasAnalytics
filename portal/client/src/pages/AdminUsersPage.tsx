import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';
import { UserProfile, UserRole, UserType } from '../types';

const ROLES = [UserRole.RETAIL, UserRole.INSTITUTIONAL, UserRole.ENTERPRISE, UserRole.ADMIN, UserRole.SUPER_ADMIN];
const USER_TYPES = [UserType.RETAIL, UserType.ACADEMIC];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    userType: '' as string,
    company: '',
    subscriber: '',
    primaryContact: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    workbookDescription: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { page, pageSize } });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Failed to update role.');
    }
  };

  const openProfileEditor = (user: UserProfile) => {
    setEditingUser(user);
    setProfileForm({
      userType: user.userType || 'retail',
      company: user.company || '',
      subscriber: user.subscriber || '',
      primaryContact: user.primaryContact || '',
      servicePeriodStart: user.servicePeriodStart || '',
      servicePeriodEnd: user.servicePeriodEnd || '',
      workbookDescription: user.workbookDescription || '',
    });
    setProfileMsg('');
  };

  const saveProfile = async () => {
    if (!editingUser) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.put(`/users/${editingUser.id}/profile`, profileForm);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      setProfileMsg('Profile saved.');
      setTimeout(() => setEditingUser(null), 800);
    } catch {
      setProfileMsg('Failed to save profile.');
    }
    setProfileSaving(false);
  };

  const totalPages = Math.ceil(total / pageSize);
  const inputClass = 'w-full px-3 py-2 bg-[#181824] border border-[#2d2d44] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6c5dd3] focus:border-transparent';

  return (
    <DashboardLayout>
      <div>
        <div className="text-[#a0a0b0] text-sm">Admin &gt; User Management</div>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-semibold text-white">User Management</h1>
          <span className="text-sm text-[#a0a0b0]">{total} users</span>
        </div>
      </div>

      <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#6c5dd3] mx-auto"></div></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#a0a0b0] text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead><tr className="border-b border-[#2d2d44]">
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Name</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Email</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Role</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">User Type</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Company</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Joined</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                  <td className="px-4 py-3 text-white">{u.name}</td>
                  <td className="px-4 py-3 text-white">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-[#181824] border border-[#2d2d44] rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6c5dd3] cursor-pointer">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.userType === 'academic' ? 'bg-[rgba(25,135,84,0.15)] text-[#198754]' : 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]'}`}>
                      {u.userType || 'retail'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#a0a0b0]">{u.company || '—'}</td>
                  <td className="px-4 py-3 text-[#a0a0b0]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openProfileEditor(u)}
                      className="text-xs text-[#6c5dd3] hover:text-white transition cursor-pointer">
                      Edit Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 bg-transparent border border-[#2d2d44] text-[#a0a0b0] rounded-md text-sm disabled:opacity-30 hover:text-[#6c5dd3] transition">Prev</button>
          <span className="text-sm text-[#a0a0b0]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 bg-transparent border border-[#2d2d44] text-[#a0a0b0] rounded-md text-sm disabled:opacity-30 hover:text-[#6c5dd3] transition">Next</button>
        </div>
      )}

      {/* Profile Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Edit Profile — {editingUser.name}</h2>
              <button onClick={() => setEditingUser(null)} className="text-[#a0a0b0] hover:text-white text-lg cursor-pointer">✕</button>
            </div>
            {profileMsg && <p className={`text-sm ${profileMsg.includes('Failed') ? 'text-[#dc3545]' : 'text-[#198754]'}`}>{profileMsg}</p>}

            <div>
              <label className="block text-xs text-[#a0a0b0] mb-1">User Type</label>
              <select value={profileForm.userType} onChange={e => setProfileForm(f => ({ ...f, userType: e.target.value }))}
                className={inputClass + ' cursor-pointer'}>
                {USER_TYPES.map(t => <option key={t} value={t}>{t === 'retail' ? 'Retail (Standard)' : 'Academic (State-Specific)'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#a0a0b0] mb-1">Company</label>
              <input value={profileForm.company} onChange={e => setProfileForm(f => ({ ...f, company: e.target.value }))} className={inputClass} placeholder="Atlas Analytics, Inc." />
            </div>
            <div>
              <label className="block text-xs text-[#a0a0b0] mb-1">Subscriber</label>
              <input value={profileForm.subscriber} onChange={e => setProfileForm(f => ({ ...f, subscriber: e.target.value }))} className={inputClass} placeholder="Client name or organization" />
            </div>
            <div>
              <label className="block text-xs text-[#a0a0b0] mb-1">Primary Account Contact</label>
              <input value={profileForm.primaryContact} onChange={e => setProfileForm(f => ({ ...f, primaryContact: e.target.value }))} className={inputClass} placeholder="contact@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a0a0b0] mb-1">Service Period Start</label>
                <input type="date" value={profileForm.servicePeriodStart} onChange={e => setProfileForm(f => ({ ...f, servicePeriodStart: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#a0a0b0] mb-1">Service Period End</label>
                <input type="date" value={profileForm.servicePeriodEnd} onChange={e => setProfileForm(f => ({ ...f, servicePeriodEnd: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#a0a0b0] mb-1">Workbook Description</label>
              <textarea value={profileForm.workbookDescription} onChange={e => setProfileForm(f => ({ ...f, workbookDescription: e.target.value }))}
                className={inputClass + ' h-20 resize-none'} placeholder="Description of the workbook contents..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveProfile} disabled={profileSaving}
                className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition cursor-pointer">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
              <button onClick={() => setEditingUser(null)}
                className="px-5 py-2.5 bg-transparent border border-[#2d2d44] text-[#a0a0b0] text-sm rounded-md hover:text-white transition cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
