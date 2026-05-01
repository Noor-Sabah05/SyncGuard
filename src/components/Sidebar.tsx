'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/history',   label: 'History',   icon: '🕰️' },
  { href: '/log',       label: 'Log Decision', icon: '✏️' },
  { href: '/conflicts', label: 'Conflict Inbox', icon: '⚠️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      setAuthLoading(true);
      fetch('/api/auth/me')
        .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) {
            setUser(null);
            return;
          }
          if (data?.user) {
            setUser(data.user);
            const label = data.user.role ? `${data.user.name} (${data.user.role})` : data.user.name;
            localStorage.setItem('syncguard_founder', label);
          }
        })
        .finally(() => setAuthLoading(false));
    };

    loadUser();
    const handleAuthChange = () => loadUser();
    window.addEventListener('syncguard-auth', handleAuthChange);
    return () => window.removeEventListener('syncguard-auth', handleAuthChange);
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('syncguard_founder');
      router.push('/auth');
    }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛡️</div>
        <span className="sidebar-logo-text">SyncGuard</span>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-account">
        <label>Active Session</label>
        {authLoading ? (
          <div className="account-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ) : user ? (
          <div className="account-details">
            <div className="account-name">{user.name}</div>
            <div className="account-meta">{user.role || 'Team member'}</div>
            <div className="account-email">{user.email}</div>
            <button className="btn btn-ghost btn-logout" onClick={handleLogout} disabled={logoutLoading}>
              {logoutLoading ? <><span className="spinner" /> Logging out…</> : 'Log out'}
            </button>
          </div>
        ) : (
          <div className="account-details">
            <div className="account-name">Not signed in</div>
            <div className="account-meta">Go to auth to continue</div>
            <Link className="btn btn-primary" href="/auth">Sign in</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
