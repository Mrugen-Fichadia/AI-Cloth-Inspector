import React, { useState, useEffect } from 'react';
import cottonFabricImg from '../assets/cotton_fabric.png';
import fabricImg from '../assets/fabric.png';
import valvetFabricImg from '../assets/Valvet_fabric.png';
import downloadIcon from '../assets/icons/download_icon.svg';
import arrowDownCurved from '../assets/icons/arrow_down_curved.svg';
import { Check, X, Eye, Sparkles, ShieldAlert, CheckCircle2, Trash2, AlertCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

const BASELINE_RESULTS = [
  {
    id: 'base-1',
    image: cottonFabricImg,
    timestamp: '06:30:05, 27 May 2022',
    fabricName: 'Colored Fabric',
    itemNumber: 'DEll6700871',
    shift: 'Morning',
    defects: ['Roughness', 'Crack', 'Pinhole'],
    status: 'Rejected'
  },
  {
    id: 'base-2',
    image: cottonFabricImg,
    timestamp: '06:30:05, 27 May 2022',
    fabricName: 'Colored Fabric',
    itemNumber: 'DEll6700871',
    shift: 'Morning',
    defects: ['Roughness', 'Pinhole'],
    status: 'Rejected'
  },
  {
    id: 'base-3',
    image: cottonFabricImg,
    timestamp: '06:30:05, 27 May 2022',
    fabricName: 'Colored Fabric',
    itemNumber: 'DEll6700871',
    shift: 'Morning',
    defects: [],
    status: 'Accepted'
  },
  {
    id: 'base-4',
    image: fabricImg,
    timestamp: '05:42:18, 27 May 2022',
    fabricName: 'Cotton Fabric',
    itemNumber: 'DEll6700872',
    shift: 'Morning',
    defects: ['Roughness', 'Loose Thread'],
    status: 'Rejected'
  },
  {
    id: 'base-5',
    image: valvetFabricImg,
    timestamp: '05:15:30, 27 May 2022',
    fabricName: 'Valvet Fabric',
    itemNumber: 'DEll6700873',
    shift: 'Night',
    defects: [],
    status: 'Accepted'
  }
];

export default function ResultsView({ 
  setNavbarLeftContent, 
  history = [], 
  onClearHistory 
}) {
  // Fabric filter state
  const [selectedFabricFilter, setSelectedFabricFilter] = useState('All Fabrics');
  const [isFabricDropdownOpen, setIsFabricDropdownOpen] = useState(false);
  const [selectedResultModal, setSelectedResultModal] = useState(null);
  const [isHistoryCleared, setIsHistoryCleared] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Normalize real inspection history items
  const formattedHistory = history.map((item, idx) => ({
    id: item.id || `hist-${idx}`,
    image: item.image || cottonFabricImg,
    timestamp: item.timestamp || item.displayTime || new Date().toLocaleString(),
    fabricName: item.fabricName || 'Colored Cotton',
    itemNumber: item.itemNumber || '568124',
    shift: item.shift || 'Morning',
    defects: item.defects || [],
    defectDetails: item.defectDetails || [],
    status: (item.status === 'REJECTED' || item.status === 'Rejected') ? 'Rejected' : 'Accepted',
    aiEngine: item.aiEngine || 'Google Gemini Vision',
    modelName: item.modelName || 'Wabric Active Model',
    latencyMs: item.latencyMs,
    isLiveScan: true
  }));

  // If history is cleared by user, empty list entirely
  const allResults = isHistoryCleared
    ? []
    : (history.length > 0 ? formattedHistory : BASELINE_RESULTS);

  // Dynamic fabric list
  const uniqueFabrics = ['All Fabrics', ...Array.from(new Set(allResults.map(r => r.fabricName)))];

  // Filter items
  const filteredResults = allResults.filter(item => {
    if (selectedFabricFilter === 'All Fabrics') return true;
    return item.fabricName === selectedFabricFilter;
  });

  // Synchronize Top Navbar with Results count
  useEffect(() => {
    if (!setNavbarLeftContent) return;

    setNavbarLeftContent(
      <div className="results-header-left-group">
        <h1 className="results-main-heading">
          Results ({filteredResults.length.toString().padStart(2, '0')})
        </h1>
      </div>
    );

    return () => {
      setNavbarLeftContent(null);
    };
  }, [filteredResults.length, setNavbarLeftContent]);

  // Download Report CSV handler
  const handleDownloadReport = () => {
    if (filteredResults.length === 0) return;
    const csvHeader = 'Timestamp,Fabric,Item Number,Shift,Status,Defects,AI Engine\n';
    const csvRows = filteredResults.map(r => 
      `"${r.timestamp}","${r.fabricName}","${r.itemNumber}","${r.shift}","${r.status}","${(r.defects || []).join('; ')}","${r.aiEngine || 'Vision'}"`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Wabric_Inspection_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all results from memory and backend history.json
  const handleConfirmClearResults = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {
      console.warn('History clear request error:', e);
    }
    if (onClearHistory) onClearHistory();
    setIsHistoryCleared(true);
    setShowClearConfirmModal(false);
  };

  return (
    <div className="results-view-root">
      {/* Action Row: Fabric Filter Dropdown & Action Buttons */}
      <div className="results-action-bar-row">
        {/* Dropdown: Fabric Filter */}
        <div className="results-filter-dropdown-wrapper">
          <button
            type="button"
            className="results-filter-btn"
            onClick={() => setIsFabricDropdownOpen(!isFabricDropdownOpen)}
          >
            <span>{selectedFabricFilter}</span>
            <img src={arrowDownCurved} alt="Arrow" className="results-dropdown-arrow" />
          </button>

          {isFabricDropdownOpen && (
            <div className="results-dropdown-menu">
              {uniqueFabrics.map((fab) => (
                <div
                  key={fab}
                  className={`results-dropdown-item ${selectedFabricFilter === fab ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedFabricFilter(fab);
                    setIsFabricDropdownOpen(false);
                  }}
                >
                  <span>{fab}</span>
                  {selectedFabricFilter === fab && <Check size={16} color="#0A5DE9" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Cluster */}
        <div className="results-action-buttons-group">
          {/* Clear Results Button */}
          <button
            type="button"
            className="results-clear-history-btn"
            onClick={() => setShowClearConfirmModal(true)}
            disabled={allResults.length === 0}
            title="Clear all inspection history from history.json"
          >
            <Trash2 size={16} />
            <span>Clear Results</span>
          </button>

          {/* Download Report Button */}
          <button
            type="button"
            className="results-download-report-btn"
            onClick={handleDownloadReport}
            disabled={filteredResults.length === 0}
          >
            <span>Download Report</span>
            <img src={downloadIcon} alt="Download" className="results-download-icon-img" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          RESULTS TABLE WITH ALIGNED COLUMNS & HEADERS
         ===================================================================== */}
      {filteredResults.length === 0 ? (
        <div className="results-empty-state-card">
          <CheckCircle2 size={48} className="empty-state-check-icon" />
          <h3 className="empty-state-title">No Inspection Results Available</h3>
          <p className="empty-state-sub">
            All inspection history has been cleared from <code>history.json</code>. Start live inspections from the Workstations tab to record new results.
          </p>
        </div>
      ) : (
        <div className="results-table-wrapper">
          {/* Table Column Headers Bar */}
          <div className="results-table-header-bar">
            <div className="res-th th-thumb">Frame Preview</div>
            <div className="res-th th-time">Timestamp</div>
            <div className="res-th th-fabric">Fabric & Batch</div>
            <div className="res-th th-model">Trained AI Model</div>
            <div className="res-th th-defects">Identified Flaws</div>
            <div className="res-th th-status">QC Decision</div>
            <div className="res-th th-action">Details</div>
          </div>

          <div className="results-rows-container">
            {filteredResults.map((item) => {
              // Parse time and date cleanly so they never collide
              let timeStr = item.timestamp;
              let dateStr = '';
              if (item.timestamp && item.timestamp.includes(',')) {
                const parts = item.timestamp.split(',');
                timeStr = parts[0].trim();
                dateStr = parts.slice(1).join(',').trim();
              }

              const isAccepted = item.status === 'Accepted';

              return (
                <div 
                  key={item.id} 
                  className="result-row-card-aligned"
                  onClick={() => setSelectedResultModal(item)}
                  title="Click to view full inspection record and bounding boxes"
                >
                  {/* Col 1: Frame Preview Thumbnail */}
                  <div className="res-td td-thumb">
                    <div className="result-thumb-wrapper">
                      <img
                        src={item.image}
                        alt={item.fabricName}
                        className="result-thumb-img"
                      />
                      {item.isLiveScan && (
                        <span className="result-live-scan-badge">
                          LIVE AI SCAN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Timestamp */}
                  <div className="res-td td-time">
                    <div className="res-time-val">{timeStr}</div>
                    {dateStr && <div className="res-date-sub">{dateStr}</div>}
                  </div>

                  {/* Col 3: Fabric Details */}
                  <div className="res-td td-fabric">
                    <div className="res-fabric-name">{item.fabricName}</div>
                    <div className="res-item-number">Item #{item.itemNumber}</div>
                    <div className="res-shift-badge">Shift: {item.shift}</div>
                  </div>

                  {/* Col 4: AI Model */}
                  <div className="res-td td-model">
                    <div className="res-model-pill" title={`Trained Model: ${item.modelName || 'Wabric Active Model'}`}>
                      <Sparkles size={13} className="res-model-sparkle" />
                      <span className="res-model-text">{item.modelName || 'Wabric-Trained-v1'}</span>
                    </div>
                    <div className="res-engine-sub">{item.aiEngine || 'Google Gemini Vision'}</div>
                  </div>

                  {/* Col 5: Identified Flaws */}
                  <div className="res-td td-defects">
                    {item.defects && item.defects.length > 0 ? (
                      <div className="res-defects-cluster">
                        <div className="res-flaws-counter">
                          {item.defects.length} defect{item.defects.length > 1 ? 's' : ''} detected:
                        </div>
                        <div className="res-defect-pills-row">
                          {item.defects.map((def, idx) => (
                            <span key={idx} className="result-defect-pill-tag">
                              {def}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="res-defect-none-pill">
                        <Check size={14} />
                        <span>0 Flaws (100% In-Spec)</span>
                      </div>
                    )}
                  </div>

                  {/* Col 6: QC Status */}
                  <div className="res-td td-status">
                    <div className={`res-status-badge ${isAccepted ? 'accepted' : 'rejected'}`}>
                      {isAccepted ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Accepted</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>Rejected</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Col 7: View Action Button */}
                  <div className="res-td td-action">
                    <button
                      type="button"
                      className="res-view-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResultModal(item);
                      }}
                    >
                      <span>View</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          CLEAR HISTORY CONFIRMATION DIALOG (Standard Wabric UI Alignment)
         ===================================================================== */}
      {showClearConfirmModal && (
        <div className="recipe-modal-backdrop" onClick={() => setShowClearConfirmModal(false)}>
          <div className="result-confirm-clear-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Clear Inspection Results</h2>
              <button
                type="button"
                className="recipe-dialog-close-btn"
                onClick={() => setShowClearConfirmModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="result-confirm-body">
              <AlertCircle size={36} className="result-confirm-warn-icon" />
              <div className="result-confirm-text-group">
                <p className="result-confirm-message">
                  Are you sure you want to clear all inspection records?
                </p>
                <span className="result-confirm-sub">
                  This action will permanently delete all saved records from <code>history.json</code> and clear the live inspection log.
                </span>
              </div>
            </div>

            <div className="result-confirm-actions-row">
              <button
                type="button"
                className="result-confirm-cancel-btn"
                onClick={() => setShowClearConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="result-confirm-danger-btn"
                onClick={handleConfirmClearResults}
              >
                Yes, Clear All Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW RESULT DETAIL DIALOG: In exact sync with other Wabric UI Dialogs
         ===================================================================== */}
      {selectedResultModal && (
        <div className="recipe-modal-backdrop" onClick={() => setSelectedResultModal(null)}>
          <div 
            className="result-inspection-dialog-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Standard Wabric Dialog Header */}
            <div className="recipe-dialog-header">
              <div className="result-dialog-title-group">
                <h2 className="recipe-dialog-title">
                  Inspection Record — #{selectedResultModal.itemNumber}
                </h2>
                <span className="result-dialog-subtitle">
                  {selectedResultModal.fabricName} • {selectedResultModal.timestamp}
                </span>
              </div>
              <button 
                type="button" 
                className="recipe-dialog-close-btn"
                onClick={() => setSelectedResultModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Meta Tags Row */}
            <div className="result-dialog-meta-row">
              <span className={`result-dialog-status-pill ${selectedResultModal.status === 'Accepted' ? 'accepted' : 'rejected'}`}>
                {selectedResultModal.status === 'Accepted' ? '✓ Accepted (Pass)' : '⚠ Rejected (Flaws Detected)'}
              </span>
              <span className="result-dialog-chip">
                Shift: {selectedResultModal.shift}
              </span>
              <span className="result-dialog-chip">
                AI Engine: {selectedResultModal.aiEngine || 'Gemini Vision AI'}
              </span>
              {selectedResultModal.modelName && (
                <span className="result-dialog-chip" style={{ color: '#00F2FE', borderColor: 'rgba(0, 242, 254, 0.35)' }}>
                  Model: {selectedResultModal.modelName}
                </span>
              )}
              <span className="result-dialog-chip">
                Flaws: {selectedResultModal.defects?.length || 0}
              </span>
            </div>

            {/* Inspection Preview Stage with Defect Bounding Boxes */}
            <div className="result-dialog-image-stage">
              <img 
                src={selectedResultModal.image} 
                alt="Captured Inspection Frame" 
                className="result-dialog-preview-img"
              />

              {/* Overlaid bounding boxes if present in details */}
              {(selectedResultModal.defectDetails || []).map((defect, i) => {
                const box = defect.box || { x: 30, y: 30, width: 25, height: 25 };
                const isCritical = defect.severity === 'critical';
                const borderColor = isCritical ? '#EF4444' : '#FF7A00';

                return (
                  <div
                    key={defect.id || i}
                    className="result-dialog-bounding-box"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      borderColor: borderColor
                    }}
                  >
                    <span
                      className="result-dialog-box-label"
                      style={{ backgroundColor: borderColor }}
                    >
                      {defect.label} ({Math.round((defect.confidence || 0.95) * 100)}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Findings & Defect Badges Card */}
            <div className="result-dialog-findings-card">
              <div className="findings-section">
                <span className="findings-title">Identified Flaws & Defect Classes:</span>
                <div className="findings-pills-cluster">
                  {selectedResultModal.defects && selectedResultModal.defects.length > 0 ? (
                    selectedResultModal.defects.map((def, idx) => (
                      <span key={idx} className="result-defect-pill-tag">
                        {def}
                      </span>
                    ))
                  ) : (
                    <span className="findings-pass-badge">✓ 100% In-Spec Quality Fabric (Zero Flaws)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="result-dialog-footer-row">
              <button 
                type="button" 
                className="result-dialog-secondary-btn"
                onClick={() => setSelectedResultModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
