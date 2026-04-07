import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, setAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const googleError = searchParams.get('error');

    if (googleError) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth(token, user);
        navigate('/dashboard');
      } catch {
        setError('Failed to process Google sign-in.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('LoginPage: email value:', email);
      console.log('LoginPage: password value before send:', password.length, password[0], password[password.length-1]);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  return (
    <div className="min-h-screen bg-[#13131a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://atlasanalytics.com/wp-content/uploads/2025/01/Group-30.png" alt="Atlas Analytics" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Atlas Analytics</h1>
          <p className="text-[#a0a0b0] mt-2">Sign in to your portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1e1e2f] rounded-xl p-8 border border-[#2d2d44] shadow-2xl space-y-5">
          {error && (
            <div className="bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545] px-4 py-3 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#a0a0b0] mb-1">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#181824] border border-[#2d2d44] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6c5dd3] focus:border-transparent"
              placeholder="you@company.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#a0a0b0] mb-1">Password</label>
            <input id="password" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#181824] border border-[#2d2d44] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6c5dd3] focus:border-transparent"
              placeholder="••••••••" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/reset-password" className="text-[#6c5dd3] hover:opacity-80 transition">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#6c5dd3] hover:bg-[#5a4cbf] disabled:opacity-50 text-white font-semibold rounded-lg transition cursor-pointer">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2d2d44]"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-[#1e1e2f] text-gray-500">or</span></div>
          </div>

          <button type="button"
            onClick={() => window.location.href = `${apiUrl}/auth/google`}
            className="w-full py-3 bg-[#181824] hover:bg-[#13131a] border border-[#2d2d44] text-white font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-[#a0a0b0] mt-4">
            Don't have an account? <Link to="/register" className="text-[#6c5dd3] hover:opacity-80 transition">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
