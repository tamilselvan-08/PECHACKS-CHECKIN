'use client';
import { useState, useEffect, useRef } from 'react';
import { Save, Undo, Search, Image as ImageIcon, CheckCircle2, AlertCircle, LayoutTemplate } from 'lucide-react';

export default function Designer() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [dragging, setDragging] = useState(null);
  const containerRef = useRef(null);
  const [timestamp, setTimestamp] = useState(Date.now()); // For cache busting the image

  const [scale, setScale] = useState(1);
  const imgRef = useRef(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new ResizeObserver(() => {
      const img = imgRef.current;
      if (img && img.naturalWidth > 0) {
        setScale(img.clientWidth / img.naturalWidth);
      }
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [loading]);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e, key) => {
    e.target.setPointerCapture(e.pointerId);
    
    // Calculate offset of the pointer inside the element itself
    const elementRect = e.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate the distance from the top-left of the element to the cursor
    // Convert this distance to percentages relative to the container width/height
    const offsetX = ((e.clientX - elementRect.left) / containerRect.width) * 100;
    const offsetY = ((e.clientY - elementRect.top) / containerRect.height) * 100;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDragging(key);
  };

  const handlePointerMove = (e) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Subtract the initial click offset so the element doesn't jump
    let x = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    let y = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setConfig(prev => ({
      ...prev,
      [dragging]: { ...prev[dragging], x, y }
    }));
  };

  const handlePointerUp = (e) => {
    setDragging(null);
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSaveMsg('Layout saved successfully');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch(e) {
      console.error(e);
      setSaveMsg('Error saving layout');
    }
    setSaving(false);
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'template');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setTimestamp(Date.now());
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Network error during upload');
    }
    setUploading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in flex flex-col h-full">
      
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ticket Designer</h2>
          <div className="text-secondary text-sm">Drag and drop elements to configure your ticket layout.</div>
        </div>
        <div className="flex items-center gap-4">
          {saveMsg && (
            <div className="flex items-center gap-2 text-sm text-success font-medium">
              <CheckCircle2 size={16} /> {saveMsg}
            </div>
          )}
          <button onClick={saveConfig} disabled={saving} className="btn btn-primary">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Design'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 flex-1" style={{ gridTemplateColumns: '320px 1fr', minHeight: 0 }}>
        
        {/* Left Sidebar - Elements & Properties */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          
          {/* Template Upload */}
          <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--primary)' }}>
            <h3 className="font-semibold text-sm mb-3">TICKET TEMPLATE</h3>
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleTemplateUpload} 
                disabled={uploading}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
              />
              <div className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                {uploading ? <div className="spinner" style={{width: 16, height: 16}}></div> : <><ImageIcon size={16} /> Replace Template</>}
              </div>
            </div>
            <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>PNG / JPG format recommended</div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-sm mb-4">ELEMENTS</h3>
            
            <div className="flex flex-col gap-3">
              {Object.keys(config).map(key => (
                <div key={key} className="p-3" style={{ backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-sm">{key}</div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config[key].visible} 
                        onChange={e => setConfig({...config, [key]: {...config[key], visible: e.target.checked}})} 
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      Visible
                    </label>
                  </div>
                  
                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>Size (px)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={config[key].size} 
                        onChange={e => setConfig({...config, [key]: {...config[key], size: Number(e.target.value)}})} 
                        style={{ padding: '0.25rem 0.5rem' }}
                      />
                    </div>
                    {config[key].color !== undefined && (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Color</label>
                        <input 
                          type="color" 
                          value={config[key].color} 
                          onChange={e => setConfig({...config, [key]: {...config[key], color: e.target.value}})} 
                          style={{ width: '100%', height: '32px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="card flex items-center justify-center p-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
          <div 
            ref={containerRef}
            style={{
              position: 'relative',
              display: 'inline-block',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              touchAction: 'none',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img 
              ref={imgRef}
              src={`/api/template?t=${timestamp}`} 
              alt="Template" 
              style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', pointerEvents: 'none' }} 
              onLoad={(e) => {
                if (e.target.naturalWidth > 0) {
                  setScale(e.target.clientWidth / e.target.naturalWidth);
                }
              }}
            />

            {/* Draggable Elements */}
            {config.teamName.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'teamName')}
                style={{
                  position: 'absolute', left: `${config.teamName.x}%`, top: `${config.teamName.y}%`,
                  color: config.teamName.color, fontSize: `${config.teamName.size * scale}px`, fontWeight: 'bold', lineHeight: 1,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'teamName' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'teamName' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                CODE WARRIORS
              </div>
            )}

            {config.teamId?.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'teamId')}
                style={{
                  position: 'absolute', left: `${config.teamId.x}%`, top: `${config.teamId.y}%`,
                  color: config.teamId.color, fontSize: `${config.teamId.size * scale}px`, fontWeight: 'bold', lineHeight: 1,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'teamId' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'teamId' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                T001
              </div>
            )}

            {config.domain?.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'domain')}
                style={{
                  position: 'absolute', left: `${config.domain.x}%`, top: `${config.domain.y}%`,
                  color: config.domain.color, fontSize: `${config.domain.size * scale}px`, fontWeight: 'bold', lineHeight: 1,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'domain' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'domain' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                Edutech
              </div>
            )}

            {config.leadName?.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'leadName')}
                style={{
                  position: 'absolute', left: `${config.leadName.x}%`, top: `${config.leadName.y}%`,
                  color: config.leadName.color, fontSize: `${config.leadName.size * scale}px`, fontWeight: 'bold', lineHeight: 1,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'leadName' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'leadName' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                Vignesh R
              </div>
            )}

            {config.membersTitle.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'membersTitle')}
                style={{
                  position: 'absolute', left: `${config.membersTitle.x}%`, top: `${config.membersTitle.y}%`,
                  color: config.membersTitle.color, fontSize: `${config.membersTitle.size * scale}px`, fontWeight: 'bold', lineHeight: 1,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'membersTitle' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'membersTitle' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                Members:
              </div>
            )}

            {config.membersList.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'membersList')}
                style={{
                  position: 'absolute', left: `${config.membersList.x}%`, top: `${config.membersList.y}%`,
                  color: config.membersList.color, fontSize: `${config.membersList.size * scale}px`, lineHeight: 1.5,
                  cursor: 'grab', userSelect: 'none', whiteSpace: 'pre-wrap',
                  textShadow: '0px 1px 3px rgba(0,0,0,0.5)',
                  border: dragging === 'membersList' ? '2px solid var(--primary)' : '1px dashed transparent',
                  padding: '2px', background: dragging === 'membersList' ? 'rgba(59,130,246,0.1)' : 'transparent'
                }}
              >
                1. Arun Kumar{'\n'}2. Priya M
              </div>
            )}

            {config.qrCode.visible && (
              <div
                onPointerDown={e => handlePointerDown(e, 'qrCode')}
                style={{
                  position: 'absolute', left: `${config.qrCode.x}%`, top: `${config.qrCode.y}%`,
                  width: `${config.qrCode.size * scale}px`, height: `${config.qrCode.size * scale}px`,
                  backgroundColor: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'grab', userSelect: 'none',
                  border: dragging === 'qrCode' ? '2px solid var(--primary)' : 'none',
                }}
              >
                <div style={{color: '#000', fontSize:'0.75rem', fontWeight: 'bold'}}>QR CODE</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
