'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, UserCheck, XCircle, Camera, RefreshCw, AlertCircle } from 'lucide-react';

export default function QRScanner() {
  const [scannedTeamId, setScannedTeamId] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    import('html5-qrcode').then((Html5Qrcode) => {
      if (!isMounted || scannerRef.current) return;

      const scanner = new Html5Qrcode.Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );

      scanner.render((decodedText) => {
        if (decodedText.startsWith('TEAM:')) {
          const id = decodedText.split(':')[1];
          if (id) {
            try { scanner.pause(true); } catch(e) { console.warn(e); }
            setScannedTeamId(id);
            fetchTeamData(id);
          }
        } else {
          // Invalid format but scanned
          try { scanner.pause(true); } catch(e) { console.warn(e); }
          setMessage({ type: 'error', text: 'Invalid QR Code format.' });
        }
      }, (error) => {});

      scannerRef.current = scanner;
    });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const fetchTeamData = async (id) => {
    setLoading(true);
    try {
      const res = await fetch('/api/excel/read');
      const data = await res.json();
      const team = data.teams?.find(t => t.id === id || t.name.toLowerCase() === id.toLowerCase());
      
      if (team) {
        setTeamData(team);
        setScannedTeamId(team.id);
        
        // Auto-select members who are NOT already checked in
        const toSelect = team.members.filter(m => m.checkInStatus !== 'Checked In').map(m => m.name);
        setSelectedMembers(toSelect);

        if (toSelect.length === 0) {
          setMessage({ type: 'warning', text: 'All members of this team are already checked in.' });
        }
      } else {
        setMessage({ type: 'error', text: 'This ticket is not associated with a registered team.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch team data.' });
    }
    setLoading(false);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if(searchTerm.trim()) {
      if (scannerRef.current) {
        try {
          scannerRef.current.pause(true);
        } catch (err) {
          console.warn("Could not pause scanner:", err);
        }
      }
      fetchTeamData(searchTerm.trim());
    }
  };

  const toggleMember = (name, isAlreadyCheckedIn) => {
    if (isAlreadyCheckedIn) return; // Prevent unchecking if already in DB
    setSelectedMembers(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleConfirm = async () => {
    if (selectedMembers.length === 0) {
      alert("Please select at least one member to mark present.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: scannedTeamId, presentMembers: selectedMembers })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Checked in ${selectedMembers.length} member(s)` });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Check-in failed due to network error.' });
    }
    setLoading(false);
  };

  const handleScanNext = () => {
    setScannedTeamId(null);
    setTeamData(null);
    setSelectedMembers([]);
    setMessage(null);
    setSearchTerm('');
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (err) {
        console.warn("Could not resume scanner:", err);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full pt-4">
      <div className="w-full max-w-md animate-fade-in flex flex-col h-full md:h-auto">
        
        <div className="mb-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-1">Check-in</h2>
          <div className="text-secondary text-sm">Scan team ticket to begin</div>
        </div>

        <div className="card flex-1 flex flex-col p-4 md:p-6 shadow-xl border-t md:border-t-0 rounded-t-2xl md:rounded-xl relative overflow-hidden bg-black/40 backdrop-blur-md">
          
          {/* Scanner Phase */}
          <div style={{ display: scannedTeamId || message || loading ? 'none' : 'block' }}>
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border-color)', backgroundColor: '#000' }}></div>
            
            <form onSubmit={handleManualSearch} className="flex items-center gap-2" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                placeholder="Or search Team ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.875rem' }}
              />
              <button type="submit" className="text-primary font-medium text-sm">Search</button>
            </form>
          </div>

          {/* Loading Phase */}
          {loading && !message && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 h-full">
              <div className="spinner"></div>
              <div className="text-secondary font-medium">Processing...</div>
            </div>
          )}

          {/* Result Phase (Team Found) */}
          {scannedTeamId && teamData && !message && !loading && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="flex items-center gap-2 text-success font-semibold mb-4 text-sm tracking-widest uppercase">
                <CheckCircle2 size={16} /> TEAM FOUND
              </div>
              
              <div className="mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="text-2xl font-bold mb-1">{teamData.name}</h3>
                <div className="text-secondary font-medium">{teamData.id} <span className="mx-2">•</span> {teamData.members.length} members</div>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 pr-2 flex flex-col gap-3">
                {teamData.members.map(member => {
                  const isCheckedIn = member.checkInStatus === 'Checked In';
                  const isSelected = selectedMembers.includes(member.name);
                  
                  return (
                    <button 
                      key={member.name}
                      onClick={() => toggleMember(member.name, isCheckedIn)}
                      disabled={isCheckedIn}
                      className="w-full text-left flex justify-between items-center p-4 rounded-xl transition-all"
                      style={{
                        backgroundColor: isCheckedIn ? 'rgba(34, 197, 94, 0.05)' : isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-2)',
                        border: `1px solid ${isCheckedIn ? 'rgba(34, 197, 94, 0.2)' : isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: isCheckedIn ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div>
                        <div className={`font-semibold ${isCheckedIn ? 'text-success' : 'text-main'}`}>
                          {member.name}
                        </div>
                        {member.isLead && <div className="text-xs text-primary mt-1 font-medium">TEAM LEAD</div>}
                      </div>
                      
                      <div>
                        {isCheckedIn ? (
                          <div className="flex flex-col items-end">
                            <span className="badge badge-success mb-1">CHECKED IN</span>
                            <span className="text-xs text-success opacity-80">{member.checkInTime}</span>
                          </div>
                        ) : isSelected ? (
                          <span className="badge badge-primary">MARK PRESENT</span>
                        ) : (
                          <span className="badge badge-default">ABSENT</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border-color)' }}>
                <button 
                  onClick={handleConfirm} 
                  disabled={selectedMembers.length === 0}
                  className="btn btn-primary w-full py-3"
                  style={{ fontSize: '1rem' }}
                >
                  <UserCheck size={18} /> FINISH CHECK-IN ({selectedMembers.length})
                </button>
                <button onClick={handleScanNext} className="btn btn-secondary w-full">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Message / Error Phase */}
          {message && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 animate-fade-in">
              <div className="mb-4">
                {message.type === 'success' ? (
                  <CheckCircle2 size={64} className="text-success mx-auto" />
                ) : message.type === 'warning' ? (
                  <AlertCircle size={64} className="text-warning mx-auto" />
                ) : (
                  <XCircle size={64} className="text-danger mx-auto" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">{message.type === 'success' ? 'Success' : message.type === 'warning' ? 'Notice' : 'Error'}</h3>
              <p className="text-secondary mb-8 px-4">{message.text}</p>
              
              <button onClick={handleScanNext} className="btn btn-primary w-full max-w-xs">
                <Camera size={18} /> Scan Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
