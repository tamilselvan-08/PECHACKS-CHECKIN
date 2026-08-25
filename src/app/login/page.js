'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="w-full max-w-md animate-fade-in relative z-10">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl rounded-full bg-primary" style={{ width: '300px', height: '300px', zIndex: -1 }}></div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto shadow-glow" style={{ backgroundColor: 'var(--primary-glow)' }}>
            <Shield size={32} color="var(--primary)" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">PEC HACKS 4.0</h1>
          <p className="text-secondary text-sm tracking-widest uppercase font-semibold">
            Organizer Dashboard
          </p>
          <p className="text-muted text-sm mt-4 px-4 leading-relaxed">
            This dashboard is strictly restricted for hackathon organizers to manage participants, tickets, and check-ins.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="input-group">
              <label className="input-label">
                Admin Password
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <Lock size={16} color="var(--text-muted)" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Enter access password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg" style={{ color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: '0.875rem' }}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  Access Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8 text-xs text-muted">
          &copy; {new Date().getFullYear()} PEC HACKS Organizing Committee
        </div>
      </div>
    </div>
  );
}
