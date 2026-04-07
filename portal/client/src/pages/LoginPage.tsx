import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-db-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://atlasanalytics.com/wp-content/uploads/2025/01/Group-30.png" alt="Atlas Analytics" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Atlas Analytics</h1>
          <p className="text-db-text mt-2">Sign in to your portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-db-panel rounded-xl p-8 border border-db-border shadow-2xl space-y-5">
          {error && (
            <div className="bg-[rgba(220,53,69,0.1)] border border-db-red text-db-red px-4 py-3 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-db-text mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-db-sidebar border border-db-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-db-purple focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-db-text mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-db-sidebar border border-db-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-db-purple focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/reset-password" className="text-db-purple hover:opacity-80 transition">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-db-purple hover:bg-db-purple/90 disabled:opacity-50 text-white font-semibold rounded-lg transition cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => { loginAsGuest(); navigate('/dashboard'); }}
            className="w-full py-3 bg-db-sidebar hover:bg-db-border disabled:opacity-50 text-db-text hover:text-white font-semibold rounded-lg border border-db-border transition cursor-pointer"
          >
            Continue as Guest
          </button>

          <p className="text-center text-sm text-db-text mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-db-purple hover:opacity-80 transition">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
