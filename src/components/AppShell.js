'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children, userRole }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-container">
      <Sidebar userRole={userRole} />
      <main className="main-content">
        <Topbar userRole={userRole} />
        <div className="content-scroll">
          {children}
        </div>
      </main>
    </div>
  );
}
