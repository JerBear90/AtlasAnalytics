import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-db-sidebar border border-db-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-db-purple focus:border-transparent';

  return (
    <div className="min-h-screen bg-db-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://atlasanalytics.com/wp-content/uploads/2025/01/Group-30.png" alt="Atlas Analytics" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Atlas Analytics</h1>
          <p className="text-db-text mt-2">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-db-panel rounded-xl p-8 border border-db-border shadow-2xl space-y-5">
          {error && (
            <div className="bg-[rgba(220,53,69,0.1)] border border-db-red text-db-red px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-db-text mb-1">Full Name</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-db-text mb-1">Email</label>
            <input id="reg-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@company.com" />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-db-text mb-1">Password</label>
            <input id="reg-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min 8 characters" />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-db-text mb-1">Confirm Password</label>
            <input id="reg-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-db-purple hover:bg-db-purple/90 disabled:opacity-50 text-white font-semibold rounded-lg transition">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2d2d44]"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-[#1e1e2f] text-gray-500">or</span></div>
          </div>

          <button type="button"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/google`}
            className="w-full py-3 bg-[#181824] hover:bg-[#13131a] border border-[#2d2d44] text-white font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-sm text-db-text mt-4">
            Already have an account? <Link to="/login" className="text-db-purple hover:text-db-purple/80 transition">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
