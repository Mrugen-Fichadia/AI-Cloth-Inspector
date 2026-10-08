import React, { useState } from 'react';
import { 
  History, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';

export default function InspectionHistoryView({ history, onClearHistory }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = (history || []).filter((item) => {
    if (filter === 'FLAGGED' && item.status !== 'FLAGGED') return false;
    if (filter === 'PASSED' && item.status !== 'PASSED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchLabel = (item.defects || []).some(d => d.label.toLowerCase().includes(q));
      const matchEngine = (item.aiEngine || '').toLowerCase().includes(q);
      const matchFabric = (item.fabricType || '').toLowerCase().includes(q);
      return matchLabel || matchEngine || matchFabric;
    }
    return true;
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `wabric-inspection-audit-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const flaggedCount = (history || []).filter(h => h.status === 'FLAGGED').length;
  const passedCount = (history || []).filter(h => h.status === 'PASSED').length;
  const defectRate = history.length > 0 ? ((flaggedCount / history.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="history-view-container">
      {/* Top Bar */}
      <div className="history-top-bar">
        <div className="bar-title-group">
          <History className="bar-title-icon" size={22} />
          <div>
            <h2 className="history-title">Textile QA Inspection Logs</h2>
            <span className="history-sub">AUDIT TRAIL OF LIVE CAMERA SCANS</span>
          </div>
        </div>

        <div className="history-actions-row">
          <button className="hud-ctrl-btn" onClick={exportJSON}>
            <Download size={16} />
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="history-stats-strip">
        <div className="history-stat-card">
          <span className="stat-label">TOTAL INSPECTED SCANS</span>
          <span className="stat-val highlight-cyan">{history?.length || 0}</span>
        </div>
        <div className="history-stat-card">
          <span className="stat-label">ACCEPTED (PASSED)</span>
          <span className="stat-val green">{passedCount}</span>
        </div>
        <div className="history-stat-card">
          <span className="stat-label">REJECTED (FLAGGED)</span>
          <span className="stat-val ruby">{flaggedCount}</span>
        </div>
        <div className="history-stat-card">
          <span className="stat-label">DEFECT RATE</span>
          <span className="stat-val">{defectRate}%</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-bar">
        <div className="search-input-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search flaw type, engine, or fabric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons-group">
          <button 
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Logs ({history.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'FLAGGED' ? 'active' : ''}`}
            onClick={() => setFilter('FLAGGED')}
          >
            Flagged ({flaggedCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'PASSED' ? 'active' : ''}`}
            onClick={() => setFilter('PASSED')}
          >
            Passed ({passedCount})
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="history-list-wrapper">
        {filteredHistory.length === 0 ? (
          <div className="history-empty-state">
            <History size={40} className="empty-icon" />
            <p>No inspection logs matching current filter.</p>
            <span>Scan fabrics in Live Inspection HUD to record new QA evaluations.</span>
          </div>
        ) : (
          <div className="history-cards-grid">
            {filteredHistory.map((item, idx) => (
              <div key={item.id || idx} className={`history-item-card ${item.status === 'FLAGGED' ? 'flagged' : 'passed'}`}>
                {item.thumbnail && (
                  <div className="history-thumb-box">
                    <img src={item.thumbnail} alt="Inspection Snapshot" />
                    <span className={`thumb-status-tag ${item.status === 'FLAGGED' ? 'ruby' : 'green'}`}>
                      {item.status}
                    </span>
                  </div>
                )}
                
                <div className="history-card-details">
                  <div className="history-card-header">
                    <div className="status-title-row">
                      {item.status === 'FLAGGED' ? (
                        <AlertTriangle size={18} className="ruby-icon" />
                      ) : (
                        <CheckCircle size={18} className="green-icon" />
                      )}
                      <span className="item-status-text">
                        {item.status === 'FLAGGED' ? `${item.defectCount} Defect(s) Detected` : 'Passed Flawless'}
                      </span>
                    </div>
                    <span className="item-timestamp">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="history-meta-row">
                    <span><strong>Engine:</strong> {item.aiEngine || 'Edge CV'}</span>
                    <span><strong>Latency:</strong> {item.latencyMs}ms</span>
                    <span><strong>Fabric:</strong> {item.fabricType || 'Woven Cloth'}</span>
                  </div>

                  {item.defects && item.defects.length > 0 && (
                    <div className="defects-tag-list">
                      {item.defects.map((d, dIdx) => (
                        <span key={dIdx} className={`defect-history-pill ${d.severity}`}>
                          {d.label} ({(d.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
