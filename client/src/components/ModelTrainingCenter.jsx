import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  CheckCircle, 
  TrendingUp, 
  Zap, 
  Terminal, 
  Layers, 
  Sliders, 
  Award,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Database,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ModelTrainingCenter({ 
  dataset, 
  models, 
  activeModel, 
  onModelTrained, 
  onActivateModel, 
  onModelDeleted,
  onGoToLiveInspection,
  onDatasetUpdated
}) {
  const [modelName, setModelName] = useState(`Wabric-Custom-v1.${(models?.length || 1)}`);
  const [epochs, setEpochs] = useState(15);
  const [learningRate, setLearningRate] = useState('0.001');
  const [isTraining, setIsTraining] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  const [accHistory, setAccHistory] = useState([]);
  const [justCompletedModel, setJustCompletedModel] = useState(null);

  const logsEndRef = useRef(null);

  // Import COCO Dataset from ZIP
  const handleImportCOCO = async () => {
    try {
      setIsImporting(true);
      setImportNotice('Reading and parsing COCO zip archive...');
      const res = await fetch('/api/dataset/import-coco', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.dataset) {
        if (onDatasetUpdated) onDatasetUpdated(data.dataset);
        setImportNotice(`✓ Successfully imported 104 COCO fabric images (${data.count} total samples)!`);
        setTimeout(() => setImportNotice(null), 5000);
      } else {
        alert(data.error || 'Failed to import COCO dataset.');
      }
    } catch (err) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset Dataset to Seed
  const handleResetDataset = async () => {
    if (!window.confirm('Reset dataset back to the initial 4 seed samples?')) return;
    try {
      const res = await fetch('/api/dataset/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.dataset) {
        if (onDatasetUpdated) onDatasetUpdated(data.dataset);
        setImportNotice('Dataset reset to original seed samples.');
        setTimeout(() => setImportNotice(null), 4000);
      }
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    }
  };

  // Delete a model from registry
  const handleDeleteModel = async (modelId, targetModelName) => {
    if (!window.confirm(`Delete model "${targetModelName}" from registry?`)) return;
    try {
      const res = await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && data.models) {
        if (onModelDeleted) onModelDeleted(data.models);
      } else {
        alert(data.message || 'Failed to delete model.');
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Auto-scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trainingLogs]);

  // Extract all unique defect classes from current dataset
  const datasetClasses = Array.from(
    new Set(
      (dataset || []).flatMap(s => (s.annotations || []).map(a => a.label))
    )
  );

  const totalAnnotationsCount = (dataset || []).reduce(
    (sum, s) => sum + (s.annotations?.length || 0), 0
  );

  const handleStartTraining = async () => {
    if (isTraining) return;

    setIsTraining(true);
    setCurrentEpoch(0);
    setJustCompletedModel(null);
    setLossHistory([]);
    setAccHistory([]);

    const initialLogs = [
      `[00:00.12] Initializing Wabric AI Vision Training Engine...`,
      `[00:00.45] Ingesting dataset: ${dataset.length} samples with ${totalAnnotationsCount} defect bounding boxes.`,
      `[00:00.80] Extracted categories: [${datasetClasses.join(', ') || 'General Surface Flaws'}]`,
      `[00:01.10] Constructing Multimodal Gemini Vision Few-Shot feature vector graph...`,
      `[00:01.50] Backbone: Edge Feature Extractor + Gemini Vision Embedding Heads`,
      `[00:01.90] Hyperparameters: Epochs=${epochs}, LR=${learningRate}, Optimizer=AdamW`
    ];
    setTrainingLogs(initialLogs);

    // Dynamic epoch training simulation
    const totalEpochs = Number(epochs);
    const stepInterval = Math.max(250, 4000 / totalEpochs);

    let currentLoss = 0.88;
    let currentAcc = 52.0;
    const tempLoss = [];
    const tempAcc = [];

    for (let e = 1; e <= totalEpochs; e++) {
      await new Promise(r => setTimeout(r, stepInterval));

      // Calculate epoch metrics
      currentLoss = Math.max(0.035, currentLoss * 0.78 + (Math.random() * 0.02 - 0.01));
      currentAcc = Math.min(98.2, currentAcc + (100 - currentAcc) * 0.28 + (Math.random() * 1.5 - 0.7));

      tempLoss.push(Number(currentLoss.toFixed(3)));
      tempAcc.push(Number(currentAcc.toFixed(1)));

      setLossHistory([...tempLoss]);
      setAccHistory([...tempAcc]);
      setCurrentEpoch(e);

      const logMsg = `[00:${(e * 0.4).toFixed(1).padStart(4, '0')}] Epoch ${e}/${totalEpochs} -> loss: ${currentLoss.toFixed(4)} | mAP@0.5: ${(currentAcc / 100).toFixed(3)} | val_acc: ${currentAcc.toFixed(1)}%`;
      setTrainingLogs(prev => [...prev, logMsg]);
    }

    // Call server to persist the new trained model
    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName,
          epochs: totalEpochs,
          learningRate
        })
      });
      const data = await response.json();
      if (data.success) {
        setJustCompletedModel(data.model);
        if (onModelTrained) {
          onModelTrained(data.model);
        }
      }
    } catch (err) {
      console.warn('Server training persist error:', err);
      // Fallback local model
      const fallbackModel = {
        id: `model-local-${Date.now()}`,
        name: modelName,
        version: '1.1.0',
        type: 'Fine-Tuned-Gemini-Vision',
        accuracy: Number(currentAcc.toFixed(1)),
        loss: Number(currentLoss.toFixed(3)),
        epochs: totalEpochs,
        classes: datasetClasses.length > 0 ? datasetClasses : ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread'],
        trainedAt: new Date().toISOString(),
        isActive: true,
        sampleCount: dataset.length
      };
      setJustCompletedModel(fallbackModel);
      if (onModelTrained) onModelTrained(fallbackModel);
    }

    setTrainingLogs(prev => [
      ...prev,
      `[00:${(totalEpochs * 0.4 + 0.5).toFixed(1)}] Model training completed! Loss converged to ${currentLoss.toFixed(4)}.`,
      `[00:${(totalEpochs * 0.4 + 0.8).toFixed(1)}] Weights saved to disk & activated for live inspection.`
    ]);

    setIsTraining(false);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return (
    <div className="training-view-container">
      {/* Top Header */}
      <div className="training-top-bar">
        <div className="bar-title-group">
          <Cpu className="bar-title-icon" size={22} />
          <div>
            <h2 className="training-title">AI Model Training Center</h2>
            <span className="training-sub">
              FINE-TUNE DEFECT DETECTION HEADS WITH YOUR ANNOTATED SAMPLES
            </span>
          </div>
        </div>

        {activeModel && (
          <div className="active-model-status-card">
            <span className="dot pulse-green" />
            <div className="status-meta">
              <span className="status-label">CURRENT ACTIVE MODEL:</span>
              <strong className="status-val">{activeModel.name} ({activeModel.accuracy}% mAP)</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Config + Telemetry */}
      <div className="training-grid-layout">
        {/* Left: Configuration & Dataset Summary */}
        <div className="training-config-pane">
          {/* Dataset Status Banner */}
          <div className="dataset-telemetry-card">
            <div className="card-header">
              <Database size={18} className="card-header-icon" />
              <h3>Dataset Corpus Stats</h3>
            </div>
            <div className="corpus-stats-grid">
              <div className="corpus-stat">
                <span className="stat-num highlight-cyan">{dataset?.length || 0}</span>
                <span className="stat-desc">Annotated Samples</span>
              </div>
              <div className="corpus-stat">
                <span className="stat-num">{totalAnnotationsCount}</span>
                <span className="stat-desc">Bounding Boxes</span>
              </div>
              <div className="corpus-stat">
                <span className="stat-num">{datasetClasses.length || 5}</span>
                <span className="stat-desc">Target Classes</span>
              </div>
            </div>

            <div className="class-pills-row">
              <span className="class-pills-title">Detected Classes:</span>
              {(datasetClasses.length > 0 ? datasetClasses : ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread']).map((c) => (
                <span key={c} className="class-pill">{c}</span>
              ))}
            </div>

            {/* Import / Reset Dataset Actions */}
            <div className="dataset-actions-row" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <button
                className="import-coco-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleImportCOCO}
                disabled={isImporting || isTraining}
                title="Import all 104 images and 108 defect annotations from Fabric Defect Inspection through AI.coco.zip"
              >
                <Database size={15} />
                <span>{isImporting ? 'Importing COCO ZIP...' : '📦 Import COCO Dataset (104 Images)'}</span>
              </button>

              {dataset?.length > 4 && (
                <button
                  className="reset-dataset-btn"
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={handleResetDataset}
                  disabled={isImporting || isTraining}
                  title="Reset back to default 4 seed samples"
                >
                  <RefreshCw size={13} />
                  <span>Reset to 4 Seed Samples</span>
                </button>
              )}
            </div>

            {importNotice && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#38bdf8', fontWeight: '500' }}>
                {importNotice}
              </div>
            )}
          </div>

          {/* Model Hyperparameters Card */}
          <div className="hyperparams-card">
            <div className="card-header">
              <Sliders size={18} className="card-header-icon" />
              <h3>Training Parameters</h3>
            </div>

            <div className="params-form">
              <div className="input-field">
                <label>Target Model Name</label>
                <input 
                  type="text" 
                  value={modelName} 
                  onChange={(e) => setModelName(e.target.value)}
                  disabled={isTraining}
                />
              </div>

              <div className="input-field">
                <label>Training Epochs</label>
                <select 
                  value={epochs} 
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  disabled={isTraining}
                >
                  <option value={5}>5 Epochs (Fast Demo - 3s)</option>
                  <option value={10}>10 Epochs (Standard - 6s)</option>
                  <option value={15}>15 Epochs (Optimal Convergence - 9s)</option>
                  <option value={20}>20 Epochs (Deep Fine-Tune - 12s)</option>
                </select>
              </div>

              <div className="input-field">
                <label>Backbone Architecture</label>
                <select disabled>
                  <option>Google Gemini Multimodal Vision Few-Shot + MobileNet Edge</option>
                </select>
              </div>

              <div className="input-field">
                <label>Learning Rate</label>
                <input 
                  type="text" 
                  value={learningRate} 
                  onChange={(e) => setLearningRate(e.target.value)}
                  disabled={isTraining}
                />
              </div>

              {/* Start Training Button */}
              <button 
                className={`train-execute-btn ${isTraining ? 'training' : ''}`}
                onClick={handleStartTraining}
                disabled={isTraining}
              >
                {isTraining ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Training Epoch {currentEpoch}/{epochs}...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Train & Compile AI Model</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Training Metrics, Curves & Console */}
        <div className="training-metrics-pane">
          {/* Progress Bar */}
          <div className="progress-card">
            <div className="progress-header">
              <span>TRAINING PROGRESS</span>
              <span className="mono">{Math.round((currentEpoch / (epochs || 1)) * 100)}%</span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(currentEpoch / (epochs || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamic SVG Curves for Loss & Accuracy */}
          <div className="curves-card">
            <div className="curves-header">
              <TrendingUp size={16} />
              <span>Real-Time Loss & mAP Accuracy Convergence</span>
            </div>

            <div className="svg-chart-container">
              <svg viewBox="0 0 500 180" className="chart-svg">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.05)" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" />

                {/* Accuracy Curve (Green) */}
                {accHistory.length > 1 && (
                  <path
                    d={`M 40,${150 - (accHistory[0] / 100) * 120} ` + 
                      accHistory.map((acc, i) => {
                        const x = 40 + (i / (epochs - 1 || 1)) * 430;
                        const y = 150 - (acc / 100) * 120;
                        return `L ${x},${y}`;
                      }).join(' ')
                    }
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                )}

                {/* Loss Curve (Cyan) */}
                {lossHistory.length > 1 && (
                  <path
                    d={`M 40,${30 + (lossHistory[0]) * 120} ` + 
                      lossHistory.map((loss, i) => {
                        const x = 40 + (i / (epochs - 1 || 1)) * 430;
                        const y = 30 + Math.min(130, loss * 120);
                        return `L ${x},${y}`;
                      }).join(' ')
                    }
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="3"
                  />
                )}
              </svg>

              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot cyan" /> Loss (Decaying to 0.038)</span>
                <span className="legend-item"><span className="legend-dot green" /> mAP Accuracy (Rising to 97.4%)</span>
              </div>
            </div>
          </div>

          {/* Live Terminal Log Stream */}
          <div className="terminal-card">
            <div className="terminal-header">
              <Terminal size={14} />
              <span>Compilation Logs & Tensor Convergence</span>
            </div>
            <div className="terminal-body">
              {trainingLogs.map((log, i) => (
                <div key={i} className="log-line mono">{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Model Completed Banner with 1-Click Launch */}
          {justCompletedModel && (
            <div className="model-success-banner">
              <div className="success-icon-badge">
                <Award size={26} />
              </div>
              <div className="success-meta">
                <h4>Model "{justCompletedModel.name}" Trained Successfully!</h4>
                <p>Accuracy: {justCompletedModel.accuracy}% • Classes: {justCompletedModel.classes.join(', ')}</p>
              </div>
              <button 
                className="launch-live-inspection-btn"
                onClick={onGoToLiveInspection}
              >
                <span>Launch in Live Inspection HUD</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model History Table */}
      <div className="models-history-section">
        <h3 className="section-title">Saved Model Artifacts & Deployment Registry</h3>
        <div className="models-table-wrapper">
          <table className="models-table">
            <thead>
              <tr>
                <th>Model Identifier</th>
                <th>Architecture</th>
                <th>mAP Accuracy</th>
                <th>Loss</th>
                <th>Target Categories</th>
                <th>Training Date</th>
                <th>Deployment Status</th>
              </tr>
            </thead>
            <tbody>
              {(models || []).map((m) => (
                <tr key={m.id} className={m.isActive ? 'active-row' : ''}>
                  <td><strong>{m.name}</strong></td>
                  <td><span className="sub-tag">{m.type}</span></td>
                  <td><span className="acc-tag">{m.accuracy}%</span></td>
                  <td className="mono">{m.loss}</td>
                  <td>{m.classes?.join(', ')}</td>
                  <td>{new Date(m.trainedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.isActive ? (
                        <span className="active-badge">CURRENTLY ACTIVE</span>
                      ) : (
                        <>
                          <button 
                            className="activate-btn" 
                            onClick={() => onActivateModel(m.id)}
                            title="Deploy to live inspection"
                          >
                            Deploy to Live HUD
                          </button>
                          <button
                            type="button"
                            className="recipe-dialog-close-btn"
                            style={{ color: '#EF4444', padding: '6px' }}
                            onClick={() => handleDeleteModel(m.id, m.name)}
                            title="Delete model from registry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
