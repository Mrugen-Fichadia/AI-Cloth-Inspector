import React, { useState, useRef, useEffect, useCallback } from 'react';
import dropdownArrowDown from '../assets/icons/dropdown_arrow_down.svg';
import exitFullscreenIcon from '../assets/icons/exit_fullscreen.svg';
import enterFullscreenIcon from '../assets/icons/enter_fullscreen.svg';
import cancelWhiteIcon from '../assets/icons/cancel_white.svg';
import { ChevronLeft, ChevronRight, Video, CheckCircle2, AlertOctagon, Scan, RefreshCw, Sparkles } from 'lucide-react';
import { playDefectAlertSound, playPassSound, playShutterSound } from '../utils/audio';

const SAMPLE_DEFECTS = [
  {
    id: 'sample-hole-1',
    label: 'Hole',
    severity: 'critical',
    confidence: 0.96,
    description: 'Puncture through warp threads with frayed perimeter',
    box: { x: 38, y: 35, width: 22, height: 24 }
  },
  {
    id: 'sample-thread-2',
    label: 'Loose Thread',
    severity: 'minor',
    confidence: 0.91,
    description: 'Surface yarn loop protruding from fabric weave',
    box: { x: 68, y: 58, width: 18, height: 20 }
  }
];

export default function LiveInspectionHUD({
  workstation,
  onClose,
  soundEnabled = true,
  geminiApiKey,
  geminiModel,
  activeModel,
  onLogInspection
}) {
  // Fullscreen vs Popup Shrinked mode (default: fullscreen mode)
  const [isShrinked, setIsShrinked] = useState(false);

  // Inspection state: 'ready' | 'accepted' | 'rejected'
  const [inspectionState, setInspectionState] = useState('ready');

  // Real-time tracking & scanning states
  const [isTracking, setIsTracking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const trackingTimerRef = useRef(null);
  const lastDefectTimeRef = useRef(0);

  // AI Detected defects from Gemini Vision model
  const [detectedDefects, setDetectedDefects] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);

  // Live telemetry data
  const [scanTelemetry, setScanTelemetry] = useState(null);

  // Frame navigation counter
  const [frameIndex, setFrameIndex] = useState(1);

  // Camera management
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('Laptop Camera / Webcam');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Keep ref synchronized with state to prevent overlapping scans
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  // Start Laptop Camera / Webcam stream
  const startWebcamStream = useCallback(async (deviceId = null) => {
    try {
      setCameraError(null);
      setIsCameraLoading(true);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (navigator.mediaDevices?.getUserMedia) {
        const constraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log('Autoplay handled:', e));
        }
        setIsCameraLoading(false);
      } else {
        throw new Error('MediaDevices API not supported in this browser.');
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setIsCameraLoading(false);
      setCameraError(err.message || 'Camera access error');
    }
  }, []);

  const stopWebcamStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Callback ref ensures video attaches instantly even during re-render
  const handleSetVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // On mount: Enumerate video devices and auto-start laptop camera
  useEffect(() => {
    startWebcamStream();

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const vDevs = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(vDevs);
        if (vDevs.length > 0) {
          setSelectedCamera(vDevs[0].label || 'Laptop Camera / Webcam');
          setSelectedDeviceId(vDevs[0].deviceId);
        }
      }).catch(() => {});
    }

    return () => {
      stopWebcamStream();
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }
    };
  }, [startWebcamStream, stopWebcamStream]);

  // Capture current video frame to JPEG Base64
  const captureFrameBase64 = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    const width = Math.min(video.videoWidth, 1280);
    const height = Math.min(video.videoHeight, 720);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Synthetic fabric frame fallback if camera hardware is unavailable
  const getSyntheticFabricFrame = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 640, 480);
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Perform Gemini inspection on the captured video frame
  const runSingleScan = async () => {
    if (isScanningRef.current) return;
    setIsScanning(true);
    setFrameIndex(prev => prev + 1);
    if (soundEnabled) playShutterSound();

    let frameBase64 = captureFrameBase64();
    if (!frameBase64) {
      frameBase64 = getSyntheticFabricFrame();
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: false }) + ', ' + now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentShift = now.getHours() < 18 ? 'Morning' : 'Night';
    const currentFabric = workstation?.recipe || 'Colored Cotton';
    const currentItemNum = workstation?.itemNumber || '568124';

    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: frameBase64,
          clientKey: geminiApiKey,
          modelName: geminiModel || 'gemini-3.1-flash-lite',
          activeModel: activeModel?.name || 'Wabric-Fabric-Base',
          fabricName: currentFabric,
          itemNumber: currentItemNum,
          shift: currentShift
        })
      });

      const data = await response.json();
      if (data && data.success) {
        const defects = data.defects || [];
        
        setScanTelemetry({
          latencyMs: data.latencyMs,
          aiEngine: data.aiEngine,
          model: data.model || activeModel?.name || 'Gemini Vision QA',
          timestamp: data.timestamp
        });

        // If defects are detected on this frame
        if (defects.length > 0) {
          lastDefectTimeRef.current = Date.now();
          setDetectedDefects(defects);
          setInspectionState('rejected');
          if (soundEnabled) playDefectAlertSound(defects[0].severity || 'critical');
          if (onLogInspection) {
            onLogInspection({
              id: `scan-${Date.now()}`,
              image: frameBase64,
              fabricName: currentFabric,
              itemNumber: currentItemNum,
              shift: currentShift,
              status: 'Rejected',
              defectCount: defects.length,
              defects: defects.map(d => d.label),
              defectDetails: defects,
              aiEngine: data.aiEngine,
              latencyMs: data.latencyMs,
              model: data.model,
              timestamp: formattedTime,
              rawTimestamp: now.toISOString()
            });
          }
        } else {
          // If 0 defects on this specific frame:
          // Defect Retention Latch: Keep defects visible on screen for at least 6s or while selected
          const timeSinceDefect = Date.now() - lastDefectTimeRef.current;
          if (timeSinceDefect > 6000 && !selectedPatch) {
            setDetectedDefects([]);
            setInspectionState('accepted');
            if (soundEnabled) playPassSound();
          }

          if (onLogInspection) {
            onLogInspection({
              id: `scan-${Date.now()}`,
              image: frameBase64,
              fabricName: currentFabric,
              itemNumber: currentItemNum,
              shift: currentShift,
              status: 'Accepted',
              defectCount: 0,
              defects: [],
              defectDetails: [],
              aiEngine: data.aiEngine,
              latencyMs: data.latencyMs,
              model: data.model,
              timestamp: formattedTime,
              rawTimestamp: now.toISOString()
            });
          }
        }
      }
    } catch (err) {
      console.error('Frame inspection error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle Tracking: Continuous real-time frame tracking with Gemini API
  const handleToggleInspect = () => {
    if (!isTracking) {
      setIsTracking(true);
      runSingleScan();
    } else {
      setIsTracking(false);
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
        trackingTimerRef.current = null;
      }
    }
  };

  // Continuous tracking timer
  useEffect(() => {
    if (isTracking) {
      trackingTimerRef.current = setInterval(() => {
        if (!isScanningRef.current) {
          runSingleScan();
        }
      }, 3000);
    } else {
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
        trackingTimerRef.current = null;
      }
    }
    return () => {
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }
    };
  }, [isTracking]);

  // Handle camera selection from dropdown
  const handleSelectCameraOption = (camLabel, deviceId = null) => {
    setSelectedCamera(camLabel);
    setSelectedDeviceId(deviceId);
    setIsCameraDropdownOpen(false);
    startWebcamStream(deviceId);
  };

  // Manual State Presets
  const handleSelectState = (newState) => {
    setInspectionState(newState);
    if (newState === 'accepted') {
      setDetectedDefects([]);
      setSelectedPatch(null);
      if (soundEnabled) playPassSound();
    } else if (newState === 'rejected') {
      if (detectedDefects.length === 0) {
        setDetectedDefects(SAMPLE_DEFECTS);
      }
      if (soundEnabled) playDefectAlertSound('critical');
    } else {
      // Ready
      setIsTracking(false);
      setDetectedDefects([]);
      setSelectedPatch(null);
    }
  };

  // Toggle between Fullscreen mode and Shrinked popup mode
  const handleToggleShrink = () => {
    setIsShrinked(prev => {
      const nextState = !prev;
      if (nextState && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return nextState;
    });
  };

  // Escape key listener: shrinks to popup if in full screen, closes if already shrinked
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isShrinked) {
          setIsShrinked(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShrinked, onClose]);

  // Status banner configuration
  const bannerConfig = {
    ready: {
      text: 'Ready to Inspect',
      bg: '#848139'
    },
    rejected: {
      text: 'Rejected',
      bg: '#B50000'
    },
    accepted: {
      text: 'Accepted',
      bg: '#108234'
    }
  };

  const currentBanner = bannerConfig[inspectionState] || bannerConfig.ready;

  // Compute dynamic defect counts based on the trained model's classes
  const modelClasses = (activeModel?.classes && Array.isArray(activeModel.classes) && activeModel.classes.length > 0)
    ? activeModel.classes
    : ['Fabric Defects', 'Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread'];

  const defectCounts = {};
  modelClasses.forEach(cls => {
    defectCounts[cls] = '00';
  });

  if (inspectionState === 'rejected') {
    const rawCounts = {};
    modelClasses.forEach(cls => { rawCounts[cls] = 0; });

    detectedDefects.forEach(d => {
      const label = (d.label || 'Defect').trim();
      const labelLower = label.toLowerCase();

      // Match against trained model classes
      let matchedCls = modelClasses.find(c => c.toLowerCase() === labelLower);
      if (!matchedCls) {
        matchedCls = modelClasses.find(c => 
          labelLower.includes(c.toLowerCase()) || c.toLowerCase().includes(labelLower)
        );
      }

      if (matchedCls) {
        rawCounts[matchedCls] = (rawCounts[matchedCls] || 0) + 1;
      } else {
        rawCounts[label] = (rawCounts[label] || 0) + 1;
      }
    });

    Object.entries(rawCounts).forEach(([cls, count]) => {
      defectCounts[cls] = String(count).padStart(2, '0');
    });
  }

  const featureCounts = {
    'Color': '01',
    'Pattern': '02',
    'Print': '01'
  };

  const totalDefectCount = inspectionState === 'rejected' ? detectedDefects.length : 0;

  const hudBody = (
    <div
      className={`fullscreen-live-inspection-hud-root ${isShrinked ? 'hud-mode-popup hud-popup-dialog-1585x831' : 'hud-mode-fullscreen'}`}
      onClick={(e) => {
        if (isShrinked) e.stopPropagation();
      }}
    >
      {/* =========================================================================
          1. TOP BAR (1920 x 100, #1F1F1F opacity 0.75)
         ========================================================================= */}
      <header className="hud-header-top-bar-1920x100">
        {/* Left Side: Recipe & Item Number & Active Model */}
        <div className="hud-title-metadata-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="hud-recipe-title">
              {workstation?.recipe || 'Colored Cotton'}
            </h1>
            <span className="hud-top-model-pill" title={`Active Trained Model: ${activeModel?.name || 'Base-V1'}`}>
              <Sparkles size={13} style={{ color: '#00F2FE' }} />
              <span>Model: {activeModel?.name || 'Wabric-Base-V1'}</span>
            </span>
          </div>
          <div className="hud-item-number-text">
            Item Number: {workstation?.itemNumber || '568124'}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="hud-top-right-controls-row">
          {/* Select Camera Dropdown */}
          <div className="hud-camera-select-wrapper">
            <button
              type="button"
              className="hud-select-camera-btn-175x48"
              onClick={() => setIsCameraDropdownOpen(!isCameraDropdownOpen)}
            >
              <span className="hud-cam-btn-label" title={selectedCamera}>
                {selectedCamera.length > 15 ? selectedCamera.slice(0, 15) + '...' : selectedCamera}
              </span>
              <img
                src={dropdownArrowDown}
                alt="Select"
                className={`hud-dropdown-caret ${isCameraDropdownOpen ? 'open' : ''}`}
              />
            </button>

            {isCameraDropdownOpen && (
              <div className="hud-camera-dropdown-menu">
                <button
                  type="button"
                  className={`hud-dropdown-option ${!selectedDeviceId ? 'active' : ''}`}
                  onClick={() => handleSelectCameraOption('Laptop Camera / Webcam', null)}
                >
                  <Video size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Laptop Camera / Webcam
                </button>
                {availableCameras.map((cam, idx) => (
                  <button
                    key={cam.deviceId || idx}
                    type="button"
                    className={`hud-dropdown-option ${selectedDeviceId === cam.deviceId ? 'active' : ''}`}
                    onClick={() => handleSelectCameraOption(cam.label || `Camera ${idx + 1}`, cam.deviceId)}
                  >
                    <Video size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {cam.label || `Camera ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start / Stop Inspect Button */}
          <button
            type="button"
            className="hud-toggle-inspect-btn-138x48"
            onClick={handleToggleInspect}
          >
            {isTracking ? 'Stop Inspect' : 'Start Inspect'}
          </button>

          {/* Fullscreen / Shrink Toggle Button (42 x 42 circle) */}
          <button
            type="button"
            className="hud-circle-icon-btn-42x42"
            onClick={handleToggleShrink}
            title={isShrinked ? "Expand to Full Screen" : "Shrink to Popup Window"}
          >
            <img
              src={isShrinked ? enterFullscreenIcon : exitFullscreenIcon}
              alt={isShrinked ? "Expand" : "Shrink"}
            />
          </button>

          {/* Close / Cancel Button (42 x 42 circle) */}
          <button
            type="button"
            className="hud-circle-icon-btn-42x42"
            onClick={onClose}
            title="Exit Inspection"
          >
            <img src={cancelWhiteIcon} alt="Close" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. LIVE CAMERA PREVIEW SCREEN WITH DEFECT PATCHES
         ========================================================================= */}
      <div className="hud-engine-canvas-viewport">
        {/* Sweeping Laser Scanner Bar when scanning */}
        {(isScanning || isTracking) && <div className="hud-laser-sweep-line" />}

        {/* Live Camera Video Element */}
        <video
          ref={handleSetVideoRef}
          autoPlay
          playsInline
          muted
          className="hud-engine-bg-image hud-live-camera-video"
        />

        {/* Camera Reticle / Loading Overlay */}
        {isCameraLoading && (
          <div className="hud-camera-viewfinder-overlay">
            <div className="hud-reticle-crosshair" />
            <span style={{ marginTop: '16px', color: '#94A3B8', fontSize: '13px', letterSpacing: '1px' }}>
              INITIALIZING LAPTOP CAMERA SENSOR...
            </span>
          </div>
        )}

        {/* Camera Permission / Access Error Fallback */}
        {cameraError && (
          <div className="hud-camera-error-backdrop">
            <AlertOctagon size={44} color="#EF4444" />
            <h3>Laptop Camera Access Needed</h3>
            <p>
              {cameraError}. Please enable camera permissions in your browser or click retry to reconnect.
            </p>
            <button
              type="button"
              className="hud-camera-action-btn"
              onClick={() => startWebcamStream(selectedDeviceId)}
            >
              Retry Camera Stream
            </button>
          </div>
        )}

        {/* Real-time AI Telemetry Badge */}
        {scanTelemetry && (
          <div className="hud-telemetry-pill">
            <div><strong>AI Engine:</strong> {scanTelemetry.aiEngine}</div>
            <div><strong>Model:</strong> {scanTelemetry.model || activeModel?.name || 'Gemini Vision QA'}</div>
            <div><strong>Inference:</strong> {scanTelemetry.latencyMs}ms</div>
            <div><strong>Status:</strong> {inspectionState === 'rejected' ? 'REJECTED (FLAWS DETECTED)' : 'PASSED (IN-SPEC)'}</div>
          </div>
        )}

        {/* =======================================================================
            DEFECT PATCH BOXES:
            Rendered whenever AI detects defects in real time!
           ======================================================================= */}
        {detectedDefects.length > 0 && (
          <div className="hud-defect-patches-layer">
            {detectedDefects.map((defect, idx) => {
              const box = defect.box || { x: 30, y: 30, width: 25, height: 25 };
              const severity = (defect.severity || 'moderate').toLowerCase();
              const patchKey = defect.id || `defect-${idx}`;
              const isSelected = selectedPatch === patchKey;

              return (
                <div
                  key={patchKey}
                  className={`hud-defect-patch-box severity-${severity} ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${Math.max(2, Math.min(94 - (box.width || 20), box.x))}%`,
                    top: `${Math.max(2, Math.min(94 - (box.height || 20), box.y))}%`,
                    width: `${Math.max(6, Math.min(75, box.width || 20))}%`,
                    height: `${Math.max(6, Math.min(75, box.height || 20))}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatch(isSelected ? null : patchKey);
                  }}
                  title={`Detected Defect: ${defect.label} (${severity})`}
                >
                  {/* Defect Pill Label with Confidence % */}
                  <div className={`hud-defect-patch-pill severity-${severity}`}>
                    <span>{defect.label}</span>
                    <span className="defect-confidence-badge">
                      {Math.round((defect.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  {/* Interactive Tooltip Details */}
                  {isSelected && (
                    <div className="hud-patch-tooltip-popup" onClick={(e) => e.stopPropagation()}>
                      <div className="hud-patch-tooltip-header">
                        <strong>{defect.label}</strong>
                        <span className={`hud-patch-severity-badge severity-${severity}`}>
                          {severity}
                        </span>
                      </div>
                      <div className="hud-patch-tooltip-body">
                        <span>Confidence: {Math.round((defect.confidence || 0.95) * 100)}%</span>
                        <span>Position: ({Math.round(box.x)}%, {Math.round(box.y)}%)</span>
                        <span>Dimensions: {Math.round(box.width)}% × {Math.round(box.height)}%</span>
                        {defect.description && (
                          <p className="hud-patch-desc">{defect.description}</p>
                        )}
                        <span className="hud-patch-model-tag">
                          Model: {scanTelemetry?.model || activeModel?.name || 'Wabric-Gemini-Trained'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. STATUS BANNER (334 x 94)
          - Ready to Inspect (#848139)
          - Rejected (#B50000)
          - Accepted (#108234)
         ========================================================================= */}
      <div
        className="hud-status-banner-334x94"
        style={{ backgroundColor: currentBanner.bg }}
        onClick={() => {
          if (inspectionState === 'ready') handleSelectState('accepted');
          else if (inspectionState === 'accepted') handleSelectState('rejected');
          else handleSelectState('ready');
        }}
        title="Click to cycle status"
      >
        <span className="hud-status-banner-text">{currentBanner.text}</span>
      </div>

      {/* =========================================================================
          4. INSPECTION RESULT PANEL (Right Overlay)
         ========================================================================= */}
      <aside className="hud-inspection-result-panel">
        <h2 className="hud-result-panel-heading">Inspection Result</h2>

        <div className="hud-result-columns-row">
          {/* Column 1: Defects */}
          <div className="hud-result-data-column defects-column">
            <div className="hud-column-header-row">
              <span className="hud-column-title-text">Defects</span>
              <span className="hud-column-count-badge">({String(totalDefectCount).padStart(2, '0')})</span>
            </div>

            <div className="hud-result-items-list">
              {Object.entries(defectCounts).map(([name, count]) => (
                <div key={name} className="hud-result-item-entry">
                  <div className="hud-result-item-label">{name}</div>
                  <div className={`hud-result-item-val ${count !== '00' ? 'highlight-flaw' : ''}`}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Features (03) */}
          <div className="hud-result-data-column features-column">
            <div className="hud-column-header-row">
              <span className="hud-column-title-text">Features</span>
              <span className="hud-column-count-badge">(03)</span>
            </div>

            <div className="hud-result-items-list">
              {Object.entries(featureCounts).map(([name, count]) => (
                <div key={name} className="hud-result-item-entry">
                  <div className="hud-result-item-label">{name}</div>
                  <div className="hud-result-item-val">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          5. BOTTOM CONTROLS & TELEMETRY
         ========================================================================= */}
      {/* Bottom Left: Live Pill Indicator */}
      <div className="hud-bottom-live-badge">
        <span className="hud-live-red-dot" />
        <span className="hud-live-label">{isTracking ? 'Tracking Live' : 'Live Camera'}</span>
      </div>

      {/* Bottom Center: Frame Navigation Buttons (‹ and ›) */}
      <div className="hud-bottom-nav-arrows">
        <button
          type="button"
          className="hud-nav-circle-btn"
          onClick={() => {
            setFrameIndex(prev => Math.max(1, prev - 1));
            runSingleScan();
          }}
          title="Scan Previous Frame"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="hud-nav-circle-btn"
          onClick={() => {
            setFrameIndex(prev => prev + 1);
            runSingleScan();
          }}
          title="Scan Next Frame"
        >
          <ChevronRight size={20} />
        </button>
      </div>


    </div>
  );

  if (isShrinked) {
    return (
      <div className="recipe-modal-backdrop hud-modal-backdrop" onClick={onClose}>
        {hudBody}
      </div>
    );
  }

  return hudBody;
}
