'use client';
import { useState, useEffect } from 'react';
import { Download, Search, Activity, Users, FileSpreadsheet } from 'lucide-react';

export default function CheckinDashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchCheckins = async () => {
    try {
      const res = await fetch('/api/excel/read');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.teams) {
        setTeams(data.teams);
      }
    } catch (err) {
      setError('Failed to load check-in data.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCheckins();
    const interval = setInterval(fetchCheckins, 30000);
    return () => clearInterval(interval);
  }, []);

  let totalParticipants = 0;
  let checkedIn = 0;
  let liveFeed = [];

  teams.forEach(team => {
    totalParticipants += team.members.length;
    team.members.forEach(member => {
      if (member.checkInStatus === 'Checked In') {
        checkedIn++;
        liveFeed.push({
          name: member.name,
          team: team.name,
          time: member.checkInTime
        });
      }
    });
  });

  liveFeed = liveFeed.reverse().slice(0, 8); // Top 8 recent
  const pending = totalParticipants - checkedIn;
  const percent = totalParticipants > 0 ? Math.round((checkedIn / totalParticipants) * 100) : 0;

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const checkedInCount = t.members.filter(m => m.checkInStatus === 'Checked In').length;
    const isComplete = checkedInCount === t.members.length;
    const isPending = checkedInCount === 0;
    const isPartial = !isComplete && !isPending;

    if (filter === 'COMPLETE') return isComplete;
    if (filter === 'PARTIAL') return isPartial;
    if (filter === 'PENDING') return isPending;
    
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="flex items-center gap-2" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            Attendance Analytics
            <div className="flex items-center gap-1 text-xs bg-danger/10 text-danger px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--danger)', display: 'inline-block' }} className="animate-pulse"></span>
              LIVE
            </div>
          </h2>
          <div className="text-secondary text-sm">Live event check-in statistics</div>
        </div>
      </div>

      {error ? (
        <div className="card border-danger/50 text-danger mb-6">{error}</div>
      ) : loading && teams.length === 0 ? (
        <div className="flex justify-center py-12"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 300px' }}>
            
            {/* Main Analytics */}
            <div className="card flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-secondary tracking-wider mb-6">EVENT PROGRESS</h3>
              
              <div className="flex items-end gap-6 mb-6">
                <div style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {percent}%
                </div>
                <div className="text-secondary pb-2 font-medium" style={{ fontSize: '1.125rem' }}>checked in</div>
              </div>

              <div style={{ width: '100%', height: '16px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--success)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
              </div>

              <div className="flex justify-between items-center border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="text-2xl font-bold">{totalParticipants}</div>
                  <div className="text-sm text-secondary">Total Expected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{checkedIn}</div>
                  <div className="text-sm text-success opacity-80">Present</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-muted">{pending}</div>
                  <div className="text-sm text-secondary">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{teams.length}</div>
                  <div className="text-sm text-primary opacity-80">Teams</div>
                </div>
              </div>
            </div>

            {/* Live Feed */}
            <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-2)' }}>
                <Activity size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-secondary tracking-wider">LIVE FEED</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                {liveFeed.length === 0 ? (
                  <div className="p-6 text-center text-secondary text-sm">No check-ins yet.</div>
                ) : (
                  liveFeed.map((lf, i) => (
                    <div key={i} className="p-3 border-b flex justify-between items-center animate-fade-in" style={{ borderColor: 'var(--border-color)' }}>
                      <div>
                        <div className="text-sm font-medium">{lf.name}</div>
                        <div className="text-xs text-muted">{lf.team}</div>
                      </div>
                      <div className="text-xs text-secondary bg-surface-3 px-2 py-1 rounded">
                        {lf.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2" style={{ width: '250px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <Search size={16} className="text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search Teams..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>
                <div className="flex gap-2">
                  {['ALL', 'COMPLETE', 'PARTIAL', 'PENDING'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className="btn text-sm"
                      style={{ 
                        backgroundColor: filter === f ? 'var(--surface-3)' : 'transparent',
                        border: filter === f ? '1px solid var(--border-color)' : '1px solid transparent',
                        color: filter === f ? 'var(--text-main)' : 'var(--text-secondary)'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              
              <a href="/api/excel/download" download className="btn btn-primary">
                <Download size={16} /> Export Excel Data
              </a>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team ID</th>
                    <th>Team Name</th>
                    <th>Members</th>
                    <th>Attendance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, idx) => {
                    const present = team.members.filter(m => m.checkInStatus === 'Checked In').length;
                    const total = team.members.length;
                    const isComplete = present === total;
                    const isPending = present === 0;

                    return (
                      <tr key={idx}>
                        <td className="font-medium text-secondary">{team.id}</td>
                        <td className="font-semibold text-main">{team.name}</td>
                        <td>{total}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{present} / {total}</div>
                            <div style={{ width: '60px', height: '6px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${(present/total)*100}%`, height: '100%', background: isComplete ? 'var(--success)' : 'var(--primary)' }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {isComplete ? (
                            <span className="badge badge-success">COMPLETE</span>
                          ) : isPending ? (
                            <span className="badge badge-default">PENDING</span>
                          ) : (
                            <span className="badge badge-primary">PARTIAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTeams.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                        No teams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
