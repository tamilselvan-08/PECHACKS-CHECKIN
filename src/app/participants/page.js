'use client';
import { useState, useEffect } from 'react';
import { Upload, Download, Search, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  
  // Upload Wizard State
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState({ text: '', type: '' });

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/excel/read');
      const data = await res.json();
      if (data.teams) {
        let allMembers = [];
        data.teams.forEach(team => {
          team.members.forEach(member => {
            allMembers.push({ ...member, teamId: team.id, teamName: team.name });
          });
        });
        setParticipants(allMembers);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg({ text: 'Uploading file...', type: 'info' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'excel');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadMsg({ text: 'File imported successfully. Refreshing data...', type: 'success' });
        setTimeout(() => {
          setShowUpload(false);
          setUploadMsg({ text: '', type: '' });
          fetchParticipants();
        }, 2000);
      } else {
        setUploadMsg({ text: data.error || 'Upload failed', type: 'error' });
      }
    } catch (err) {
      setUploadMsg({ text: 'Network error during upload', type: 'error' });
    }
    setUploading(false);
  };

  const filteredData = participants.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.teamId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'Present') return p.checkInStatus === 'Checked In';
    if (filter === 'Absent') return p.checkInStatus !== 'Checked In';
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Participants</h2>
          <div className="text-secondary text-sm">{participants.length} registered participants</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowUpload(!showUpload)} className="btn btn-primary">
            <Upload size={16} /> Import Excel
          </button>
          <a href="/api/excel/download" download className="btn btn-secondary">
            <Download size={16} /> Export Excel
          </a>
        </div>
      </div>

      {showUpload && (
        <div className="card mb-6 animate-fade-in" style={{ border: '1px dashed var(--primary)' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold mb-1">Import Participants</h3>
              <p className="text-secondary text-sm">Upload your master `.xlsx` file. This will overwrite current data.</p>
            </div>
            <a href="/api/excel/template" className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.75rem' }}>Download Template</a>
          </div>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={handleFileUpload} 
              disabled={uploading}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div className="flex flex-col items-center justify-center gap-2" style={{ padding: '3rem', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', pointerEvents: 'none' }}>
              {uploading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <FileSpreadsheet size={32} color="var(--text-muted)" />
                  <div className="font-medium">Drag & drop .xlsx or click to browse</div>
                </>
              )}
            </div>
          </div>
          
          {uploadMsg.text && (
            <div className={`mt-4 p-3 rounded text-sm flex gap-2 items-center ${uploadMsg.type === 'success' ? 'bg-success/10 text-success' : uploadMsg.type === 'error' ? 'bg-danger/10 text-danger' : 'bg-surface-3 text-main'}`}
                 style={{ backgroundColor: uploadMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : uploadMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'var(--surface-3)', 
                          color: uploadMsg.type === 'success' ? 'var(--success)' : uploadMsg.type === 'error' ? 'var(--danger)' : 'var(--text-main)', 
                          borderRadius: 'var(--radius-sm)' }}>
              {uploadMsg.type === 'success' ? <Check size={16}/> : uploadMsg.type === 'error' ? <AlertCircle size={16}/> : null}
              {uploadMsg.text}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2" style={{ width: '300px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, email, team ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <div className="flex gap-2">
            {['All', 'Present', 'Absent'].map(f => (
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
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            No participants found matching your criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="font-medium text-main">{p.name}</div>
                      <div className="text-muted text-sm">{p.email || 'No email provided'}</div>
                    </td>
                    <td>
                      <div className="font-medium">{p.teamName}</div>
                      <div className="text-muted text-sm">{p.teamId}</div>
                    </td>
                    <td>
                      {p.checkInStatus === 'Checked In' ? (
                        <span className="badge badge-success">PRESENT</span>
                      ) : (
                        <span className="badge badge-default">ABSENT</span>
                      )}
                    </td>
                    <td className="text-secondary text-sm">
                      {p.checkInTime || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
