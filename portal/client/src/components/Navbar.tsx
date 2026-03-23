import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;

  const navLink = (to: string, label: string) => (
    <Link to={to} onClick={() => setMenuOpen(false)}
      className={`px-3 py-2 rounded-lg text-sm transition ${location.pathname === to ? 'bg-cosmic-700 text-coral' : 'text-gray-300 hover:text-white hover:bg-cosmic-700'}`}>
      {label}
    </Link>
  );

  return (
    <nav className="bg-cosmic-800 border-b border-cosmic-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="text-lg font-bold text-white tracking-tight">Atlas<span className="text-coral">.</span></Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLink('/dashboard', 'Dashboard')}
          {isAdmin && navLink('/admin/csv', 'CSV Upload')}
          {isAdmin && navLink('/admin/users', 'Users')}
          {navLink('/settings', 'Settings')}
          <button onClick={logout} className="ml-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition">Logout</button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cosmic-800 border-t border-cosmic-600 px-4 py-3 flex flex-col gap-1">
          {navLink('/dashboard', 'Dashboard')}
          {isAdmin && navLink('/admin/csv', 'CSV Upload')}
          {isAdmin && navLink('/admin/users', 'Users')}
          {navLink('/settings', 'Settings')}
          <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left px-3 py-2 text-sm text-gray-400 hover:text-white transition">Logout</button>
        </div>
      )}
    </nav>
  );
}
