'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Ticket, CheckCircle2, UserCheck, Mail, Send, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalTeams: 0,
    checkedIn: 0,
    teamsCheckedIn: 0,
    generated: 0,
    sent: 0,
    failed: 0,
    recentCheckins: []
  });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Parse role from cookie
    const getRole = () => {
      const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
      if (match) return match[2];
      return 'volunteer';
    };
    setRole(getRole());

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/excel/read');
        const data = await res.json();
        
        if (data.teams) {
          let tParticipants = 0;
          let tCheckedIn = 0;
          let tTeamsCheckedIn = 0;
          let tGenerated = 0;
          let tSent = 0;
          let tFailed = 0;
          let recent = [];

          data.teams.forEach(team => {
            tParticipants += team.members.length;
            if (team.generated) tGenerated++;
            if (team.sentStatus === 'SENT') tSent++;
            if (team.sentStatus === 'FAILED') tFailed++;

            let hasCheckedInMember = false;
            team.members.forEach(member => {
              if (member.checkInStatus === 'Checked In') {
                tCheckedIn++;
                hasCheckedInMember = true;
                recent.push({
                  name: member.name,
                  team: team.name,
                  time: member.checkInTime
                });
              }
            });
            if (hasCheckedInMember) tTeamsCheckedIn++;
          });

          // Sort recent checkins by time (assuming standard time string formats, fallback to just reverse array)
          recent = recent.reverse().slice(0, 5);

          setStats({
            totalParticipants: tParticipants,
            totalTeams: data.teams.length,
            checkedIn: tCheckedIn,
            teamsCheckedIn: tTeamsCheckedIn,
            generated: tGenerated,
            sent: tSent,
            failed: tFailed,
            recentCheckins: recent
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    // Poll every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const teamCheckInPercent = stats.totalTeams > 0 
    ? Math.round((stats.teamsCheckedIn / stats.totalTeams) * 100) 
    : 0;

  if (role === 'volunteer') {
    return (
      <div className="animate-fade-in pb-8 max-w-3xl mx-auto mt-8">
        <div className="card mb-8 relative overflow-hidden text-center" style={{ border: 'none', background: 'var(--gradient-card)' }}>
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="relative z-10 p-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <ScanIcon />
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Scanner Terminal</h1>
            <p className="text-muted text-sm font-medium tracking-wide mb-6">
              Check in participants by scanning their QR code.
            </p>
            <button onClick={() => router.push('/scan')} className="btn btn-primary w-full max-w-sm justify-center" style={{ padding: '1rem' }}>
              <ScanIcon /> Open Camera Scanner
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-8 font-semibold text-lg flex items-center gap-2 justify-center">
            <UserCheck /> Team Check-in Status
          </h3>
          
          <div className="flex items-end gap-4 mb-4 justify-center">
            <div className="text-6xl font-bold leading-none tracking-tight">{teamCheckInPercent}%</div>
          </div>

          <div className="w-full h-4 bg-surface-3 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-success rounded-full" 
              style={{ 
                width: `${teamCheckInPercent}%`, 
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' 
              }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-surface-2/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-main mb-1">{stats.teamsCheckedIn}</div>
              <div className="text-xs text-secondary font-semibold uppercase tracking-wider">Teams Present</div>
            </div>
            <div className="bg-surface-2/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-main mb-1">{stats.totalTeams - stats.teamsCheckedIn}</div>
              <div className="text-xs text-secondary font-semibold uppercase tracking-wider">Teams Remaining</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="animate-fade-in pb-8">
      {/* Hero Section */}
      <div className="card mb-8 relative overflow-hidden" style={{ border: 'none', background: 'var(--gradient-card)' }}>
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl rounded-full bg-primary" style={{ width: '300px', height: '300px', transform: 'translate(20%, -30%)' }}></div>
        
        <div className="relative z-10 p-2">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="badge badge-primary mb-3">Hackathon Operations</div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight">PEC HACKS 4.0</h1>
              <div className="text-muted text-sm font-medium tracking-wide">
                22 AUGUST 2026 · PANIMALAR ENGINEERING COLLEGE
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => router.push('/scan')} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                <ScanIcon /> Launch Scanner
              </button>
              <button onClick={() => router.push('/participants')} className="btn btn-secondary">
                Manage Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner"></div></div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="card flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="text-secondary text-xs font-bold tracking-widest uppercase">Registered Teams</div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-4xl font-bold text-main">{stats.totalTeams}</div>
            </div>
            
            <div className="card flex flex-col justify-center border-t-2" style={{ borderTopColor: 'var(--success)' }}>
              <div className="flex justify-between items-start mb-2">
                <div className="text-secondary text-xs font-bold tracking-widest uppercase">Teams Checked In</div>
                <div className="p-2 bg-success/10 rounded-lg text-success">
                  <UserCheck size={20} />
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold text-main">{stats.teamsCheckedIn}</div>
                <div className="text-success text-sm font-medium mb-1">({teamCheckInPercent}%)</div>
              </div>
            </div>

            <div className="card flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="text-secondary text-xs font-bold tracking-widest uppercase">Total Participants</div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-4xl font-bold text-main">{stats.totalParticipants}</div>
            </div>
          </div>

          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* Left Column */}
            <div className="flex flex-col gap-8">
              
              {/* Ticket Status overview */}
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="card text-center p-6 border-t-2" style={{ borderTopColor: 'var(--primary)' }}>
                  <div className="text-secondary text-xs font-bold tracking-widest uppercase mb-3">TICKETS GENERATED</div>
                  <div className="text-3xl font-bold">{stats.generated} <span className="text-muted text-sm font-medium">/ {stats.totalTeams}</span></div>
                </div>
                <div className="card text-center p-6 border-t-2" style={{ borderTopColor: 'var(--info)' }}>
                  <div className="text-secondary text-xs font-bold tracking-widest uppercase mb-3">TICKETS SENT</div>
                  <div className="text-3xl font-bold text-info">{stats.sent}</div>
                </div>
                <div className="card text-center p-6 border-t-2" style={{ borderTopColor: stats.failed > 0 ? 'var(--danger)' : 'var(--surface-3)' }}>
                  <div className="text-secondary text-xs font-bold tracking-widest uppercase mb-3">EMAILS FAILED</div>
                  <div className="text-3xl font-bold" style={{ color: stats.failed > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{stats.failed}</div>
                </div>
              </div>

              {/* Attendance Overview */}
              <div className="card">
                <h3 className="mb-8 font-semibold text-lg flex items-center gap-2">
                  <BarChartIcon /> Team Attendance Overview
                </h3>
                
                <div className="flex items-end gap-4 mb-4">
                  <div className="text-5xl font-bold leading-none tracking-tight">{teamCheckInPercent}%</div>
                  <div className="text-secondary font-medium pb-1">of teams arrived</div>
                </div>

                <div className="w-full h-3 bg-surface-3 rounded-full overflow-hidden mb-6">
                  <div 
                    className="h-full bg-success rounded-full" 
                    style={{ 
                      width: `${teamCheckInPercent}%`, 
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' 
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm bg-surface-2/50 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> 
                    <span className="font-semibold text-main">{stats.teamsCheckedIn} Teams Present</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-surface-3"></div> 
                    <span className="text-secondary font-medium">{stats.totalTeams - stats.teamsCheckedIn} Remaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              
              {/* Quick Actions */}
              <div className="card">
                <h3 className="mb-6 font-semibold text-sm text-secondary tracking-widest uppercase">QUICK ACTIONS</h3>
                <div className="flex flex-col gap-3">
                  <button onClick={() => router.push('/participants')} className="btn btn-secondary w-full justify-start p-4 hover:bg-surface-3 transition-colors rounded-xl border border-border/50">
                    <Users size={18} className="text-primary" /> <span className="font-semibold">Import Participants</span>
                  </button>
                  <button onClick={() => router.push('/designer')} className="btn btn-secondary w-full justify-start p-4 hover:bg-surface-3 transition-colors rounded-xl border border-border/50">
                    <Ticket size={18} className="text-warning" /> <span className="font-semibold">Ticket Designer</span>
                  </button>
                  <button onClick={() => router.push('/tickets')} className="btn btn-secondary w-full justify-start p-4 hover:bg-surface-3 transition-colors rounded-xl border border-border/50">
                    <Send size={18} className="text-info" /> <span className="font-semibold">Send Tickets</span>
                  </button>
                  <button onClick={() => router.push('/checkins')} className="btn btn-secondary w-full justify-start p-4 hover:bg-surface-3 transition-colors rounded-xl border border-border/50">
                    <BarChartIcon /> <span className="font-semibold">View Attendance</span>
                  </button>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div className="card flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-sm text-secondary tracking-widest uppercase">RECENT CHECK-INS</h3>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                </div>
                
                {stats.recentCheckins.length === 0 ? (
                  <div className="text-muted text-sm py-8 text-center flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-surface-2"><UserCheck size={24} className="text-muted" /></div>
                    <p>No check-ins yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {stats.recentCheckins.map((rc, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-surface-2 transition-colors border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-surface flex items-center justify-center border border-border text-sm font-bold text-primary">
                            {rc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-main">{rc.name}</div>
                            <div className="text-muted text-xs">{rc.team}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-success">
                            <CheckCircle2 size={14} />
                            <span className="text-xs font-medium">Checked In</span>
                          </div>
                          <div className="text-muted text-[10px] uppercase tracking-wider">{rc.time || 'Just now'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScanIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>;
}

function BarChartIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
}
