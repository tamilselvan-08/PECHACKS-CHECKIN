'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  ScanLine, 
  BarChart3, 
  Palette, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ userRole = 'volunteer' }) {
  const pathname = usePathname();

  const navItems = userRole === 'admin' 
    ? [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'Participants', href: '/participants', icon: Users },
        { name: 'Tickets', href: '/tickets', icon: Ticket },
        { name: 'Check-in', href: '/scan', icon: ScanLine },
        { name: 'Attendance', href: '/checkins', icon: BarChart3 },
      ]
    : [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'Check-in', href: '/scan', icon: ScanLine },
      ];

  const adminItems = userRole === 'admin' 
    ? [
        { name: 'Ticket Designer', href: '/designer', icon: Palette },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : [];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--surface-1)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.05em' }}>PEC HACKS 4.0</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Operations</p>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--surface-2)' : 'transparent',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
              {item.name}
            </Link>
          );
        })}

        {adminItems.length > 0 && (
          <>
            <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)' }} />

            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--surface-2)' : 'transparent',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  <Icon size={18} color={isActive ? 'var(--text-main)' : 'currentColor'} />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={16} color="var(--primary)" />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {userRole === 'admin' ? 'Admin' : 'Volunteer'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Online</div>
        </div>
      </div>
    </aside>
  );
}
