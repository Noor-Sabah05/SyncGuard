'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConflictItem {
  id: number;
  severity: string;
  conflict_type: string;
  status: string;
  prior_founder: string;
  prior_summary: string;
}

interface DecisionItem {
  id: number;
  founder_id: string;
  category: string;
  summary: string;
  content: string;
  created_at: string;
  conflicts: ConflictItem[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Decision History</h1>
        <p className="page-subtitle">A timeline of all logged decisions and conflicts</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 40, justifyContent: 'center' }}>
          <span className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading history…</span>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No history yet</div>
          <div className="empty-state-text">Start logging decisions to build your timeline.</div>
        </div>
      ) : (
        <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {history.map((d) => (
            <div key={d.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600 }}>{d.founder_id}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(d.created_at)}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Category: {d.category}
              </div>
              <div style={{ fontSize: '15px', lineHeight: 1.5, marginBottom: '16px' }}>
                {d.summary}
              </div>

              {d.conflicts && d.conflicts.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Triggered Conflicts:</div>
                  {d.conflicts.map(c => (
                    <div key={c.id} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={`severity-badge ${c.severity}`}>
                          {c.severity === 'red' && '🔴 Critical'}
                          {c.severity === 'amber' && '🟠 High'}
                          {c.severity === 'blue' && '🔵 Info'}
                          {' '}Conflict
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          background: c.status === 'open' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: c.status === 'open' ? '#fde047' : '#86efac',
                          textTransform: 'capitalize'
                        }}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>{c.conflict_type}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Conflicted with prior decision by {c.prior_founder}: "{c.prior_summary}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
