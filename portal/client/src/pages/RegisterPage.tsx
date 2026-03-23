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
          <p className="text-center text-sm text-db-text mt-4">
            Already have an account? <Link to="/login" className="text-db-purple hover:text-db-purple/80 transition">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
