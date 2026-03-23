import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';
import { UserProfile, UserRole } from '../types';

const ROLES = [UserRole.RETAIL, UserRole.INSTITUTIONAL, UserRole.ENTERPRISE, UserRole.ADMIN];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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

  const totalPages = Math.ceil(total / pageSize);

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
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Joined</th>
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
                  <td className="px-4 py-3 text-[#a0a0b0]">{new Date(u.createdAt).toLocaleDateString()}</td>
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
    </DashboardLayout>
  );
}
