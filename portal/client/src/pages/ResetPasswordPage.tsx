import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-db-sidebar border border-db-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-db-purple focus:border-transparent';

  if (!token) {
    return (
      <div className="min-h-screen bg-db-dark flex items-center justify-center px-4">
        <div className="bg-db-panel rounded-xl p-8 border border-db-border shadow-2xl text-center max-w-md">
          <p className="text-db-red">Invalid reset link. Please request a new one.</p>
          <Link to="/reset-password" className="inline-block mt-4 text-db-purple hover:text-db-purple/80 transition text-sm">Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-db-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Atlas Analytics</h1>
          <p className="text-db-text mt-2">Set your new password</p>
        </div>
        <div className="bg-db-panel rounded-xl p-8 border border-db-border shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="text-db-green text-lg">Password reset successful</div>
              <Link to="/login" className="inline-block mt-4 text-db-purple hover:text-db-purple/80 transition">Sign in with your new password</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-[rgba(220,53,69,0.1)] border border-db-red text-db-red px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>}
              <div>
                <label htmlFor="new-pw" className="block text-sm font-medium text-db-text mb-1">New Password</label>
                <input id="new-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min 8 characters" />
              </div>
              <div>
                <label htmlFor="confirm-pw" className="block text-sm font-medium text-db-text mb-1">Confirm Password</label>
                <input id="confirm-pw" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-db-purple hover:bg-db-purple/90 disabled:opacity-50 text-white font-semibold rounded-lg transition">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
