'use client';
import { useState, useEffect } from 'react';
import { Search, Send, Download, Mail, RefreshCw, X, CheckCircle2, AlertTriangle, ChevronRight, Eye } from 'lucide-react';

export default function TicketsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState({});
  const [previewTeam, setPreviewTeam] = useState(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/excel/read');
      const data = await res.json();
      if (data.teams) {
        setTeams(data.teams);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) || 
                          t.id?.toLowerCase().includes(search.toLowerCase()) || 
                          t.leadName?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === 'SENT') return t.ticketSentStatus === 'SENT';
    if (filter === 'NOT SENT') return !t.ticketSentStatus || t.ticketSentStatus !== 'SENT';
    if (filter === 'FAILED') return t.ticketSentStatus === 'FAILED';
    return true;
  });

  const sendSingle = async (teamId) => {
    setActionLoading(prev => ({...prev, [teamId]: true}));
    try {
      const res = await fetch('/api/tickets/send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ teamId })
      });
      const data = await res.json();
      if(data.success) {
        setPreviewTeam(null);
        await fetchTeams();
      } else {
        alert(data.error || 'Failed to send ticket');
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(prev => ({...prev, [teamId]: false}));
  };

  const pendingIds = teams.filter(t => t.ticketSentStatus !== 'SENT' && t.leadEmail).map(t => t.id);

  const executeBulkSend = async () => {
    setBulkSending(true);
    try {
      await fetch('/api/tickets/bulk-send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ teamIds: pendingIds })
      });
      await fetchTeams();
      setBulkConfirm(false);
    } catch (e) {
      console.error(e);
    }
    setBulkSending(false);
  };

  // Stats
  const stats = {
    total: teams.length,
    sent: teams.filter(t => t.ticketSentStatus === 'SENT').length,
    failed: teams.filter(t => t.ticketSentStatus === 'FAILED').length,
    pending: teams.filter(t => t.ticketSentStatus !== 'SENT').length
  };

  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tickets</h2>
          <div className="text-secondary text-sm">Generate, preview and send team tickets.</div>
        </div>
        <div className="flex gap-3">
          <a href="/designer" className="btn btn-secondary">
            <Eye size={16} /> Ticket Designer
          </a>
          <button onClick={() => setBulkConfirm(true)} disabled={pendingIds.length === 0} className="btn btn-primary">
            <Send size={16} /> Bulk Send Pending ({pendingIds.length})
          </button>
        </div>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card text-center" style={{ padding: '1.25rem' }}>
          <div className="text-secondary text-sm font-semibold mb-2">TOTAL TEAMS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div className="card text-center" style={{ padding: '1.25rem' }}>
          <div className="text-secondary text-sm font-semibold mb-2">SENT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>{stats.sent}</div>
        </div>
        <div className="card text-center" style={{ padding: '1.25rem' }}>
          <div className="text-secondary text-sm font-semibold mb-2">PENDING</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--warning)' }}>{stats.pending}</div>
        </div>
        <div className="card text-center" style={{ padding: '1.25rem' }}>
          <div className="text-secondary text-sm font-semibold mb-2">FAILED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.failed > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{stats.failed}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2" style={{ width: '300px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search team, team ID, lead..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <div className="flex gap-2">
            {['ALL', 'NOT SENT', 'SENT', 'FAILED'].map(f => (
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

        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner"></div></div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            No teams found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filteredTeams.map(team => (
              <div key={team.id} className="card flex flex-col justify-between" style={{ padding: '1.5rem', gap: '1rem' }}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-lg">{team.id}</div>
                      <div className="text-sm text-secondary font-medium tracking-wide uppercase">{team.name}</div>
                    </div>
                    {team.ticketSentStatus === 'SENT' ? (
                      <CheckCircle2 size={20} color="var(--success)" />
                    ) : team.ticketSentStatus === 'FAILED' ? (
                      <AlertTriangle size={20} color="var(--danger)" />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)', marginTop: '0.375rem' }} />
                    )}
                  </div>
                  
                  <div className="text-sm text-muted mb-4">
                    {team.members.length} members<br/>
                    Lead: {team.leadName || 'Unknown'} <br/>
                    {team.leadEmail || 'No email provided'}
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary">Delivery</span>
                      {team.ticketSentStatus === 'SENT' ? (
                        <span className="text-success flex items-center gap-1"><CheckCircle2 size={14}/> Sent</span>
                      ) : team.ticketSentStatus === 'FAILED' ? (
                        <span className="text-danger flex items-center gap-1"><AlertTriangle size={14}/> Failed</span>
                      ) : (
                        <span className="text-warning">Not Sent</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPreviewTeam(team)} className="btn btn-secondary flex-1">
                    Preview
                  </button>
                  <button 
                    onClick={() => sendSingle(team.id)} 
                    disabled={actionLoading[team.id] || !team.leadEmail}
                    className="btn btn-primary flex-1"
                  >
                    {actionLoading[team.id] ? 'Sending...' : (team.ticketSentStatus === 'SENT' ? 'Resend' : 'Send Ticket')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Preview Modal */}
      {previewTeam && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-fade-in flex flex-col" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', padding: 0, overflow: 'hidden' }}>
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-semibold">Ticket Preview</h3>
              <button onClick={() => setPreviewTeam(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-auto bg-black p-6 flex justify-center items-center">
              <iframe 
                src={`/api/tickets/generate?teamId=${previewTeam.id}`} 
                style={{ width: '100%', height: '500px', border: 'none', backgroundColor: '#fff', borderRadius: 'var(--radius-md)' }} 
                title="Ticket Preview"
              />
            </div>
            
            <div className="p-4 border-t flex justify-between items-center bg-surface-1" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="font-semibold">{previewTeam.name}</div>
                <div className="text-sm text-secondary">{previewTeam.id}</div>
              </div>
              <div className="flex gap-3">
                <a href={`/api/tickets/generate?teamId=${previewTeam.id}`} download={`${previewTeam.id}.pdf`} className="btn btn-secondary">
                  <Download size={16}/> Download
                </a>
                <button 
                  onClick={() => sendSingle(previewTeam.id)} 
                  disabled={actionLoading[previewTeam.id] || !previewTeam.leadEmail}
                  className="btn btn-primary"
                >
                  <Send size={16}/> {actionLoading[previewTeam.id] ? 'Sending...' : 'Send Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirm Modal */}
      {bulkConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: '1.25rem' }}>Bulk Send Tickets</h3>
            
            {bulkSending ? (
              <div className="py-6 flex flex-col items-center justify-center gap-4">
                <div className="spinner"></div>
                <div>Sending {pendingIds.length} tickets...</div>
                <div className="text-sm text-secondary">Please do not close this window.</div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-secondary">
                  You are about to send tickets to <strong className="text-main">{pendingIds.length}</strong> pending teams. This process may take a few minutes depending on your email provider limits.
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setBulkConfirm(false)} className="btn btn-secondary">Cancel</button>
                  <button onClick={executeBulkSend} className="btn btn-primary">
                    <Send size={16}/> Send {pendingIds.length} Tickets
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
