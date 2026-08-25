'use client';
import { useState, useEffect } from 'react';
import { Mail, Calendar, Settings as SettingsIcon, Database, HardDrive, CheckCircle2, Save, FileText } from 'lucide-react';

export default function SettingsPage() {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('/api/email-config')
      .then(res => res.json())
      .then(data => {
        if (data.subject) setEmailSubject(data.subject);
        if (data.html) setEmailHtml(data.html);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSaveEmailConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, html: emailHtml })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Email template saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save template.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error while saving.' });
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>System Settings</h2>
        <div className="text-secondary text-sm">Configure event details and email provider in your `.env.local` file.</div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Email Template Editor */}
        <div className="card border-primary border" style={{ borderColor: 'var(--primary)' }}>
          <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h3 className="font-semibold text-lg">Email Template Editor</h3>
            </div>
            {message && (
              <span className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'} animate-fade-in`}>
                {message.text}
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="py-8 text-center text-secondary">Loading template...</div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Subject Line</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label flex justify-between">
                  <span>HTML Email Body</span>
                  <span className="text-xs text-primary">Available tags: {{teamName}}, {{teamId}}, {{leadName}}, {{eventName}}, {{eventDate}}</span>
                </label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '300px', fontFamily: 'monospace', resize: 'vertical' }}
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveEmailConfig}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Event Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <Calendar size={18} className="text-primary" />
            <h3 className="font-semibold">Event Information</h3>
          </div>
          
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Event Name</label>
              <input type="text" className="input-field" disabled value="PEC HACKS 4.0" />
            </div>
            <div className="input-group">
              <label className="input-label">Event Date</label>
              <input type="text" className="input-field" disabled value="August 22, 2026" />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Venue</label>
              <input type="text" className="input-field" disabled value="Panimalar Engineering College" />
            </div>
          </div>
          <div className="text-xs text-muted mt-4">These values are configured in the environment variables.</div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <Mail size={18} className="text-primary" />
            <h3 className="font-semibold">Email Configuration (SMTP)</h3>
          </div>
          
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">SMTP Host</label>
              <input type="text" className="input-field" disabled value="smtp.office365.com (Configured)" />
            </div>
            <div className="input-group">
              <label className="input-label">SMTP Port</label>
              <input type="text" className="input-field" disabled value="587" />
            </div>
            <div className="input-group">
              <label className="input-label">Sender Email</label>
              <input type="text" className="input-field" disabled value="your-email@outlook.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Sender Name</label>
              <input type="text" className="input-field" disabled value="Hackathon Organizer" />
            </div>
          </div>
          <div className="text-xs text-muted mt-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success" /> Email credentials are securely loaded from your environment.
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <HardDrive size={18} className="text-primary" />
            <h3 className="font-semibold">System & Storage</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <Database size={20} className="text-secondary" />
                <div>
                  <div className="font-medium text-sm">Primary Data Source</div>
                  <div className="text-xs text-muted">/data/participants.xlsx</div>
                </div>
              </div>
              <span className="badge badge-success">HEALTHY</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <SettingsIcon size={20} className="text-secondary" />
                <div>
                  <div className="font-medium text-sm">Ticket Configuration</div>
                  <div className="text-xs text-muted">/data/ticketConfig.json</div>
                </div>
              </div>
              <span className="badge badge-success">SYNCED</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
