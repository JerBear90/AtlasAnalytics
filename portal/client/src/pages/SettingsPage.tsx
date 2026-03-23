import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';
import { UserRole } from '../types';

export default function SettingsPage() {
  const { user, logout, setAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [nameMsg, setNameMsg] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // SSO state (admin only)
  const isAdmin = user?.role === UserRole.ADMIN;
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleCallbackUrl, setGoogleCallbackUrl] = useState('');
  const [ssoMsg, setSsoMsg] = useState('');
  const [ssoError, setSsoError] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      api.get('/settings/sso').then(({ data }) => {
        setGoogleClientId(data.google_client_id || '');
        setGoogleClientSecret(''); // Don't prefill masked secret
        setGoogleCallbackUrl(data.google_callback_url || '');
      }).catch(() => {});
    }
  }, [isAdmin]);

  const handleNameUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setNameMsg('');
    setNameLoading(true);
    try {
      const { data } = await api.put('/users/me', { name });
      setAuth(localStorage.getItem('atlas_token')!, { ...user!, name: data.name });
      setNameMsg('Name updated.');
    } catch {
      setNameMsg('Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwLoading(true);
    try {
      await api.put('/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSsoUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSsoMsg(''); setSsoError('');
    if (!googleClientId.trim()) { setSsoError('Client ID is required.'); return; }
    setSsoLoading(true);
    try {
      const body: Record<string, string> = { google_client_id: googleClientId };
      if (googleClientSecret.trim()) body.google_client_secret = googleClientSecret;
      if (googleCallbackUrl.trim()) body.google_callback_url = googleCallbackUrl;
      await api.put('/settings/sso', body);
      setSsoMsg('SSO settings saved.');
      setGoogleClientSecret('');
    } catch (err: any) {
      setSsoError(err.response?.data?.error || 'Failed to save SSO settings.');
    } finally {
      setSsoLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-[#181824] border border-[#2d2d44] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6c5dd3] focus:border-transparent';

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <div className="text-[#a0a0b0] text-sm">Account &gt; Settings</div>
          <h1 className="text-2xl font-semibold text-white mt-1">Account Settings</h1>
        </div>

        <div className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44] space-y-3">
          <h2 className="text-base font-semibold text-white">Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[#a0a0b0]">Email</span><p className="text-white mt-1">{user?.email}</p></div>
            <div><span className="text-[#a0a0b0]">Role</span><p className="text-white mt-1 capitalize">{user?.role}</p></div>
          </div>
        </div>

        <form onSubmit={handleNameUpdate} className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44] space-y-4">
          <h2 className="text-base font-semibold text-white">Update Name</h2>
          {nameMsg && <p className="text-sm text-[#198754]">{nameMsg}</p>}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Your name" />
          <button type="submit" disabled={nameLoading} className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition cursor-pointer">
            {nameLoading ? 'Saving...' : 'Save'}
          </button>
        </form>

        <form onSubmit={handlePasswordChange} className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44] space-y-4">
          <h2 className="text-base font-semibold text-white">Change Password</h2>
          {pwMsg && <p className="text-sm text-[#198754]">{pwMsg}</p>}
          {pwError && <p className="text-sm text-[#dc3545]">{pwError}</p>}
          <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className={inputClass} placeholder="Current password" />
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required className={inputClass} placeholder="New password (min 8 chars)" />
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className={inputClass} placeholder="Confirm new password" />
          <button type="submit" disabled={pwLoading} className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition cursor-pointer">
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        {/* SSO Configuration — Admin only */}
        {isAdmin && (
          <form onSubmit={handleSsoUpdate} className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44] space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Google SSO Configuration</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(108,93,211,0.15)] text-[#6c5dd3] font-medium">Admin</span>
            </div>
            <p className="text-[13px] text-[#a0a0b0]">
              Configure Google OAuth credentials to enable "Continue with Google" login. Get these from the
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[#6c5dd3] hover:opacity-80 ml-1">Google Cloud Console</a>.
            </p>
            {ssoMsg && <p className="text-sm text-[#198754]">{ssoMsg}</p>}
            {ssoError && <p className="text-sm text-[#dc3545]">{ssoError}</p>}
            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1">Client ID</label>
              <input type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)}
                className={inputClass} placeholder="123456789.apps.googleusercontent.com" />
            </div>
            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1">Client Secret</label>
              <input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)}
                className={inputClass} placeholder="Leave blank to keep existing secret" />
            </div>
            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1">Callback URL</label>
              <input type="text" value={googleCallbackUrl} onChange={(e) => setGoogleCallbackUrl(e.target.value)}
                className={inputClass} placeholder="https://your-api-domain.com/api/auth/google/callback" />
            </div>
            <button type="submit" disabled={ssoLoading} className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition cursor-pointer">
              {ssoLoading ? 'Saving...' : 'Save SSO Settings'}
            </button>
          </form>
        )}

        <div className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44]">
          <h2 className="text-base font-semibold text-white mb-3">Session</h2>
          <button onClick={logout} className="px-5 py-2.5 bg-[#dc3545] hover:bg-[#dc3545]/90 text-white text-sm font-medium rounded-md transition cursor-pointer">
            Log Out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
