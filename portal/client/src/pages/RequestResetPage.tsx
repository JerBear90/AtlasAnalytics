import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-db-sidebar border border-db-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-db-purple focus:border-transparent';

  return (
    <div className="min-h-screen bg-db-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Atlas Analytics</h1>
          <p className="text-db-text mt-2">Reset your password</p>
        </div>
        <div className="bg-db-panel rounded-xl p-8 border border-db-border shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-db-green text-lg">Check your email</div>
              <p className="text-db-text text-sm">If an account exists with that email, we've sent a reset link.</p>
              <Link to="/login" className="inline-block mt-4 text-db-purple hover:text-db-purple/80 transition text-sm">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-[rgba(220,53,69,0.1)] border border-db-red text-db-red px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>}
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-db-text mb-1">Email address</label>
                <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@company.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-db-purple hover:bg-db-purple/90 disabled:opacity-50 text-white font-semibold rounded-lg transition">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-db-text"><Link to="/login" className="text-db-purple hover:text-db-purple/80 transition">Back to sign in</Link></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
