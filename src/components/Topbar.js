'use client';
import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Topbar({ userRole = 'volunteer' }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Overview';
      case '/participants': return 'Participants';
      case '/tickets': return 'Ticket Manager';
      case '/scan': return 'Check-in Scanner';
      case '/checkins': return 'Attendance Analytics';
      case '/designer': return 'Ticket Designer';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{getPageTitle()}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-color)',
          padding: '0.375rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          width: '300px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search participants, teams..." 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              width: '100%',
              outline: 'none'
            }} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Bell size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{userRole}</div>
            <button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                fontSize: '0.875rem', marginLeft: '0.5rem', color: 'var(--danger)'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
