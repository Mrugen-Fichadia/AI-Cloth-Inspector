import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Cpu, 
  Sliders, 
  Volume2, 
  CheckCircle, 
  ExternalLink, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Check, 
  ShieldCheck,
  Layers
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKey, 
  onSaveApiKey, 
  modelName, 
  onChangeModel, 
  confidenceThreshold, 
  onChangeConfidence, 
  soundEnabled, 
  onToggleSound,
  activeModel
}) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelName || 'gemini-3.1-flash-lite');
  const [threshold, setThreshold] = useState(confidenceThreshold || 0.60);
  const [localSound, setLocalSound] = useState(soundEnabled ?? true);
  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when props change
  useEffect(() => {
    if (apiKey !== undefined) setInputKey(apiKey || '');
    if (modelName) setSelectedModel(modelName);
    if (confidenceThreshold) setThreshold(confidenceThreshold);
    if (soundEnabled !== undefined) setLocalSound(soundEnabled);
  }, [apiKey, modelName, confidenceThreshold, soundEnabled, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onChangeModel(selectedModel);
    onChangeConfidence(threshold);
    if (onToggleSound) onToggleSound(localSound);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 350);
  };

  const handleTestConnection = async () => {
    if (!inputKey.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter a Google Gemini API Key first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Contacting Google Gemini Vision API...');

    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: inputKey.trim(),
          modelName: selectedModel,
          image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      });

      const data = await response.json();
      if (data.success && data.aiEngine && data.aiEngine.includes('Google-Gemini')) {
        setTestStatus('success');
        setTestMessage('Gemini Vision API connected successfully!');
      } else {
        setTestStatus('error');
        setTestMessage('Fallback engine responded. Please verify your Google Gemini API key.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Failed to reach inspection server: ' + err.message);
    }
  };

  return (
    <div className="recipe-modal-backdrop" onClick={onClose}>
      <div 
        className="settings-dialog-820x680" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="settings-dialog-title"
      >
        {/* ===================================================================
            1. DIALOG HEADER (Aligned with Wabric Dialogs)
           =================================================================== */}
        <div className="recipe-dialog-header">
          <div className="settings-header-left-group">
            <div className="settings-header-icon-badge">
              <Cpu size={22} color="#0A5DE9" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="recipe-dialog-title">
                AI & Model Configuration
              </h2>
              <span className="settings-dialog-subtitle">
                Configure computer vision engine, Google Gemini API, and live inspection sensitivity
              </span>
            </div>
          </div>

          <button 
            type="button" 
            className="recipe-dialog-close-btn" 
            onClick={onClose}
            title="Close Settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================================================================
            2. ACTIVE MODEL STATUS OVERVIEW BANNER
           =================================================================== */}
        {activeModel && (
          <div className="settings-active-model-card">
            <div className="active-model-left">
              <Sparkles size={18} className="active-model-sparkle" />
              <div>
                <div className="active-model-label">CURRENT ACTIVE FABRIC MODEL</div>
                <div className="active-model-name">{activeModel.name}</div>
              </div>
            </div>
            <div className="active-model-chips">
              <span className="active-model-chip green">
                <Check size={13} />
                <span>{activeModel.accuracy || 96.1}% Accuracy</span>
              </span>
              <span className="active-model-chip blue">
                <Layers size={13} />
                <span>{activeModel.classes?.length || 6} Defect Classes</span>
              </span>
            </div>
          </div>
        )}

        {/* ===================================================================
            3. SCROLLABLE SETTINGS BODY
           =================================================================== */}
        <div className="settings-scroll-content">
          {/* SECTION A: Google Gemini Vision API Key */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title-wrap">
                <Key size={18} className="settings-section-icon" />
                <h3 className="settings-section-title">Google Gemini Vision API Key</h3>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="settings-get-key-link"
              >
                <span>Get Free Key (Google AI Studio)</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <p className="settings-section-desc">
              Connect your Gemini API key to run real-time multimodel defect analysis. If left unconfigured, Wabric automatically switches to the offline Edge-CV Anomaly Engine.
            </p>

            <div className="settings-input-group">
              <div className="settings-input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your AIzaSy... API key here"
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (testStatus) setTestStatus(null);
                  }}
                  className="settings-text-input mono"
                />
                <button 
                  type="button" 
                  className="settings-toggle-eye-btn"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <button 
                type="button" 
                className="settings-test-key-btn"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw size={15} className="settings-spin-icon" />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="settings-feedback-banner success">
                <CheckCircle size={16} />
                <span>{testMessage}</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="settings-feedback-banner error">
                <AlertCircle size={16} />
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* SECTION B: Vision Model Selection */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title-wrap">
                <Cpu size={18} className="settings-section-icon" />
                <h3 className="settings-section-title">Vision Model Selection</h3>
              </div>
              <span className="settings-badge-sub">Gemini Multimodal Inference</span>
            </div>

            <p className="settings-section-desc">
              Select the Gemini model variant used to analyze camera frames and localize fabric defects.
            </p>

            <div className="settings-models-grid">
              {/* Option 1: gemini-3.1-flash-lite (Recommended for high quota) */}
              <div 
                className={`settings-model-card ${selectedModel === 'gemini-3.1-flash-lite' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              >
                <div className="model-card-top-row">
                  <div className="model-card-name">gemini-3.1-flash-lite</div>
                  {selectedModel === 'gemini-3.1-flash-lite' ? (
                    <span className="model-selected-indicator">
                      <Check size={13} /> Selected
                    </span>
                  ) : (
                    <span className="model-speed-badge">500 RPD • Recommended</span>
                  )}
                </div>
                <div className="model-card-desc">
                  Highest free quota (500 req/day, 15 RPM). High speed, avoids 429 rate limit errors during continuous live camera scans.
                </div>
              </div>

              {/* Option 2: gemini-3.5-flash */}
              <div 
                className={`settings-model-card ${selectedModel === 'gemini-3.5-flash' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gemini-3.5-flash')}
              >
                <div className="model-card-top-row">
                  <div className="model-card-name">gemini-3.5-flash</div>
                  {selectedModel === 'gemini-3.5-flash' ? (
                    <span className="model-selected-indicator">
                      <Check size={13} /> Selected
                    </span>
                  ) : (
                    <span className="model-speed-badge subtle">20 RPD • 5 RPM</span>
                  )}
                </div>
                <div className="model-card-desc">
                  Balanced multimodal vision model with high spatial defect localization accuracy. Free quota: 20 req/day.
                </div>
              </div>

              {/* Option 3: gemini-3.8-flash */}
              <div 
                className={`settings-model-card ${selectedModel === 'gemini-3.8-flash' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gemini-3.8-flash')}
              >
                <div className="model-card-top-row">
                  <div className="model-card-name">gemini-3.8-flash</div>
                  {selectedModel === 'gemini-3.8-flash' ? (
                    <span className="model-selected-indicator">
                      <Check size={13} /> Selected
                    </span>
                  ) : (
                    <span className="model-speed-badge subtle">20 RPD • 5 RPM</span>
                  )}
                </div>
                <div className="model-card-desc">
                  Next-gen flagship vision model. Highest reasoning depth, but restricted to 20 req/day on Google AI Studio free tier.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: Sensitivity & Alert Preferences */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title-wrap">
                <Sliders size={18} className="settings-section-icon" />
                <h3 className="settings-section-title">Sensitivity & Audio Alerts</h3>
              </div>
            </div>

            {/* Slider Row */}
            <div className="settings-slider-container">
              <div className="settings-slider-meta-row">
                <span className="settings-slider-label">Minimum Confidence Threshold</span>
                <span className="settings-slider-val-pill">
                  {Math.round(threshold * 100)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0.4" 
                max="0.9" 
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="settings-range-slider"
              />
              <div className="settings-slider-hints-row">
                <span>0.40 (Catch subtle flaws)</span>
                <span>Default: 0.60</span>
                <span>0.90 (High strictness)</span>
              </div>
            </div>

            <div className="settings-divider-sub" />

            {/* Audio Siren Toggle */}
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <Volume2 size={18} className="settings-toggle-icon" />
                <div>
                  <div className="settings-toggle-title">Audio Alert Sirens</div>
                  <div className="settings-toggle-sub">Play audio tone when defects are detected on live camera</div>
                </div>
              </div>

              <label className="settings-switch-toggle">
                <input 
                  type="checkbox" 
                  checked={localSound}
                  onChange={(e) => setLocalSound(e.target.checked)}
                />
                <span className="settings-switch-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* ===================================================================
            4. DIALOG FOOTER (Aligned with Wabric Standard)
           =================================================================== */}
        <div className="settings-dialog-footer">
          <button 
            type="button" 
            className="recipe-dialog-btn secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="recipe-dialog-btn primary"
            onClick={handleSave}
          >
            <CheckCircle size={17} />
            <span>{saveSuccess ? 'Settings Applied!' : 'Save & Apply Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
