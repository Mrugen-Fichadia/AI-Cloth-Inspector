import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Tag, 
  AlertCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function AnnotationStudio({ 
  dataset = [], 
  onSaveSample, 
  onDeleteSample, 
  onNavigateToTraining,
  onBack,
  initialImage,
  initialAnnotations = []
}) {
  // Working Image & Metadata
  const [currentImage, setCurrentImage] = useState(initialImage || null);
  const [sampleName, setSampleName] = useState('Fabric Defect Inspection');
  const [fabricType, setFabricType] = useState('Woven Textile');

  // Annotation List
  const [annotations, setAnnotations] = useState(initialAnnotations || []);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);

  // Active Classification Tool
  const [activeLabel, setActiveLabel] = useState('Fabric Defects');
  const [customLabelInput, setCustomLabelInput] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('critical');

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentDragBox, setCurrentDragBox] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Zoom & Viewport controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Canvas & Image Refs
  const canvasRef = useRef(null);
  const imageElementRef = useRef(null);
  const containerRef = useRef(null);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState('');

  const defectCategories = [
    'Fabric Defects',
    'Hole',
    'Tear',
    'Oil Stain',
    'Weaving Flaw',
    'Loose Thread',
    'Broken Yarn'
  ];

  // Show brief feedback toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Sync initial image and annotations
  useEffect(() => {
    if (initialImage) {
      setCurrentImage(initialImage);
    }
    if (Array.isArray(initialAnnotations)) {
      setAnnotations(initialAnnotations);
      if (initialAnnotations.length > 0 && initialAnnotations[0].label) {
        setActiveLabel(initialAnnotations[0].label);
      }
    }
  }, [initialImage, initialAnnotations]);

  // Handle natural image load to obtain real aspect ratio
  const handleImageLoad = () => {
    const img = imageElementRef.current;
    if (img) {
      const nw = img.naturalWidth || 800;
      const nh = img.naturalHeight || 400;
      setImageDimensions({ width: nw, height: nh });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = nw;
        canvas.height = nh;
      }
      redrawCanvas();
    }
  };

  // Redraw Canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base fabric image
    const img = imageElementRef.current;
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Draw existing defect annotations
    annotations.forEach((ann) => {
      const isSelected = ann.id === selectedAnnotationId;
      const x = (ann.box.x / 100) * canvas.width;
      const y = (ann.box.y / 100) * canvas.height;
      const w = (ann.box.width / 100) * canvas.width;
      const h = (ann.box.height / 100) * canvas.height;

      let strokeColor = '#00F2FE';
      let fillColor = 'rgba(0, 242, 254, 0.18)';
      let badgeBg = '#00F2FE';
      let textColor = '#0B1320';

      if (ann.severity === 'critical') {
        strokeColor = '#EF4444';
        fillColor = 'rgba(239, 68, 68, 0.22)';
        badgeBg = '#EF4444';
        textColor = '#FFFFFF';
      } else if (ann.severity === 'moderate') {
        strokeColor = '#FF7A00';
        fillColor = 'rgba(255, 122, 0, 0.22)';
        badgeBg = '#FF7A00';
        textColor = '#FFFFFF';
      }

      ctx.save();
      // Outer glow for selected box
      if (isSelected) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 12;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      // Label Tag Badge
      const labelText = (ann.label || 'DEFECT').toUpperCase();
      ctx.font = 'bold 12px "Noto Sans", sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeH = 22;
      const badgeW = textWidth + 16;
      const badgeY = Math.max(0, y - badgeH - 3);

      ctx.shadowBlur = 0;
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.roundRect(x, badgeY, badgeW, badgeH, 4);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.fillText(labelText, x + 8, badgeY + 15);

      // Corner handles if selected
      if (isSelected) {
        ctx.fillStyle = '#FFFFFF';
        const handleSize = 6;
        ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      }

      ctx.restore();
    });

    // Draw active dragging box
    if (currentDragBox) {
      const x = (currentDragBox.x / 100) * canvas.width;
      const y = (currentDragBox.y / 100) * canvas.height;
      const w = (currentDragBox.width / 100) * canvas.width;
      const h = (currentDragBox.height / 100) * canvas.height;

      ctx.save();
      ctx.strokeStyle = '#00F2FE';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [annotations, selectedAnnotationId, currentDragBox, currentImage, imageDimensions]);

  // Get mouse coordinates relative to the canvas in percentage
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
    return { x: percentX, y: percentY };
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentDragBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
    setSelectedAnnotationId(null);
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: Math.round(coords.x * 10) / 10, y: Math.round(coords.y * 10) / 10 });

    if (!isDrawing || !startPoint) return;

    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setCurrentDragBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentDragBox) return;
    setIsDrawing(false);

    // Minimum size threshold to prevent accidental clicks
    if (currentDragBox.width > 0.8 && currentDragBox.height > 0.8) {
      const chosenLabel = activeLabel === 'Custom' 
        ? (customLabelInput.trim() || 'Fabric Defects') 
        : activeLabel;

      const newAnn = {
        id: `ann-${Date.now()}`,
        label: chosenLabel,
        severity: activeSeverity,
        box: {
          x: Math.round(currentDragBox.x * 100) / 100,
          y: Math.round(currentDragBox.y * 100) / 100,
          width: Math.round(currentDragBox.width * 100) / 100,
          height: Math.round(currentDragBox.height * 100) / 100
        },
        confidence: 0.95
      };
      setAnnotations(prev => [...prev, newAnn]);
      setSelectedAnnotationId(newAnn.id);
      showToast(`Added ${chosenLabel} defect box`);
    }

    setCurrentDragBox(null);
    setStartPoint(null);
  };

  // Undo last bounding box
  const handleUndo = () => {
    if (annotations.length === 0) return;
    const removed = annotations[annotations.length - 1];
    setAnnotations(prev => prev.slice(0, -1));
    showToast(`Removed ${removed.label || 'box'}`);
  };

  // Clear all bounding boxes
  const handleClearAll = () => {
    if (annotations.length === 0) return;
    if (window.confirm('Are you sure you want to clear all defect annotations on this image?')) {
      setAnnotations([]);
      setSelectedAnnotationId(null);
      showToast('All annotations cleared');
    }
  };

  // Delete single annotation
  const handleDeleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    showToast('Defect annotation deleted');
  };

  // Save changes
  const handleSave = () => {
    if (!currentImage) return;

    if (onSaveSample) {
      onSaveSample({
        name: sampleName,
        fabricType: fabricType,
        image: currentImage,
        annotations: annotations
      });
    }

    showToast('Saved defect annotations successfully!');
  };

  return (
    <div className="wabric-annotation-studio-root">
      {/* Hidden natural image loader */}
      {currentImage && (
        <img
          ref={imageElementRef}
          src={currentImage}
          alt="Fabric Under Inspection"
          style={{ display: 'none' }}
          onLoad={handleImageLoad}
        />
      )}

      {/* Top Header & Breadcrumb Bar */}
      <div className="studio-navbar-header">
        <div className="studio-nav-left">
          {onBack && (
            <button 
              className="studio-back-btn"
              onClick={onBack}
              title="Return to Recipes"
            >
              <ArrowLeft size={18} />
              <span>Back to Recipe</span>
            </button>
          )}

          <div className="studio-breadcrumb-trail">
            <span className="crumb-root">Recipes</span>
            <ChevronRight size={14} className="crumb-separator" />
            <span className="crumb-current">{sampleName}</span>
            <ChevronRight size={14} className="crumb-separator" />
            <span className="crumb-badge">Annotation Studio</span>
          </div>
        </div>

        <div className="studio-nav-right">
          {/* Defect Counter Tag */}
          <div className="studio-defect-summary-pill">
            <span className={`pill-dot ${annotations.length > 0 ? 'dot-flaw' : 'dot-clean'}`} />
            <span>{annotations.length} Defect(s) Marked</span>
          </div>

          {/* Action: Undo */}
          <button 
            className="studio-action-btn secondary"
            onClick={handleUndo}
            disabled={annotations.length === 0}
            title="Undo last box"
          >
            <RotateCcw size={16} />
            <span>Undo</span>
          </button>

          {/* Action: Clear All */}
          <button 
            className="studio-action-btn secondary danger"
            onClick={handleClearAll}
            disabled={annotations.length === 0}
            title="Clear all bounding boxes"
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>

          {/* Action: Save & Apply */}
          <button 
            className="studio-action-btn primary"
            onClick={handleSave}
            title="Save annotations to dataset and recipe"
          >
            <Check size={16} />
            <span>Save Annotations</span>
          </button>

          {/* Action: Train Model */}
          {onNavigateToTraining && (
            <button 
              className="studio-action-btn training-glow"
              onClick={onNavigateToTraining}
              title="Train model with updated annotations"
            >
              <Sparkles size={16} />
              <span>Train Model</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="studio-floating-toast">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Split Layout */}
      <div className="studio-main-workbench">
        {/* Left: Viewport Stage */}
        <div className="studio-canvas-stage-card">
          {/* Stage Controls Toolbar */}
          <div className="stage-controls-bar">
            <div className="stage-controls-left">
              <span className="stage-instruction-hint">
                <Crosshair size={15} />
                <span>Click & drag across fabric flaw to create defect box</span>
              </span>
            </div>

            <div className="stage-controls-right">
              {/* Zoom Buttons */}
              <button 
                className="stage-tool-icon-btn"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="stage-zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
              <button 
                className="stage-tool-icon-btn"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                className="stage-tool-icon-btn"
                onClick={() => setZoomLevel(1)}
                title="Fit to View"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Canvas Scrollable Viewport */}
          <div className="studio-viewport-container" ref={containerRef}>
            <div 
              className="studio-canvas-wrapper"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <canvas
                ref={canvasRef}
                className="studio-fabric-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </div>
          </div>

          {/* Stage Bottom Status Strip */}
          <div className="stage-bottom-status-strip">
            <div className="stage-stat-item">
              <span className="stat-label">Resolution:</span>
              <span className="stat-val">{imageDimensions.width} × {imageDimensions.height} px</span>
            </div>
            <div className="stage-stat-item">
              <span className="stat-label">Cursor:</span>
              <span className="stat-val">X: {cursorPos.x}% | Y: {cursorPos.y}%</span>
            </div>
            <div className="stage-stat-item">
              <span className="stat-label">Active Flaw:</span>
              <span className="stat-val highlight">{activeLabel} ({activeSeverity.toUpperCase()})</span>
            </div>
          </div>
        </div>

        {/* Right: Defect Classification Tools Sidebar */}
        <div className="studio-sidebar-tools-pane">
          {/* Card 1: Defect Category Palette */}
          <div className="studio-tool-panel-card">
            <div className="panel-card-header">
              <Tag size={16} className="panel-header-icon" />
              <h3 className="panel-card-title">Defect Category</h3>
            </div>

            <div className="defect-category-pill-grid">
              {defectCategories.map((cat) => (
                <button
                  key={cat}
                  className={`defect-category-btn ${activeLabel === cat ? 'active' : ''}`}
                  onClick={() => setActiveLabel(cat)}
                >
                  <span className="cat-color-dot" />
                  <span className="cat-text">{cat}</span>
                  {activeLabel === cat && <Check size={14} className="cat-active-check" />}
                </button>
              ))}

              <button
                className={`defect-category-btn custom ${activeLabel === 'Custom' ? 'active' : ''}`}
                onClick={() => setActiveLabel('Custom')}
              >
                <span className="cat-text">+ Custom Class</span>
              </button>
            </div>

            {activeLabel === 'Custom' && (
              <div className="custom-defect-input-box">
                <input
                  type="text"
                  placeholder="Type flaw name (e.g. Broken Selvedge)"
                  value={customLabelInput}
                  onChange={(e) => setCustomLabelInput(e.target.value)}
                  className="studio-text-input"
                />
              </div>
            )}
          </div>

          {/* Card 2: Severity Picker */}
          <div className="studio-tool-panel-card">
            <div className="panel-card-header">
              <AlertCircle size={16} className="panel-header-icon" />
              <h3 className="panel-card-title">Severity Level</h3>
            </div>

            <div className="severity-pill-selection-row">
              {[
                { id: 'minor', label: 'Minor Flaw', color: '#EAB308' },
                { id: 'moderate', label: 'Moderate', color: '#FF7A00' },
                { id: 'critical', label: 'Critical / Reject', color: '#EF4444' }
              ].map((sev) => (
                <button
                  key={sev.id}
                  className={`severity-select-pill ${sev.id} ${activeSeverity === sev.id ? 'active' : ''}`}
                  onClick={() => setActiveSeverity(sev.id)}
                >
                  <span className="sev-dot" style={{ backgroundColor: sev.color }} />
                  <span>{sev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Defect Annotations List */}
          <div className="studio-tool-panel-card flex-fill">
            <div className="panel-card-header">
              <Layers size={16} className="panel-header-icon" />
              <h3 className="panel-card-title">Annotated Flaws ({annotations.length})</h3>
            </div>

            {annotations.length === 0 ? (
              <div className="empty-annotations-state">
                <Crosshair size={28} className="empty-state-crosshair" />
                <p className="empty-title">No defects annotated yet</p>
                <span className="empty-sub">
                  Drag on the fabric preview on the left to mark defect locations.
                </span>
              </div>
            ) : (
              <div className="studio-annotations-scroll-list">
                {annotations.map((ann, idx) => (
                  <div
                    key={ann.id || idx}
                    className={`studio-ann-list-item ${selectedAnnotationId === ann.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAnnotationId(ann.id)}
                  >
                    <div className="ann-item-left">
                      <div className="ann-item-top-row">
                        <span className={`ann-severity-badge ${ann.severity || 'critical'}`}>
                          {ann.label || 'Defect'}
                        </span>
                        <span className="ann-severity-text">
                          {(ann.severity || 'critical').toUpperCase()}
                        </span>
                      </div>
                      <div className="ann-coords-meta">
                        [{ann.box.x}%, {ann.box.y}%] · {ann.box.width} × {ann.box.height}%
                      </div>
                    </div>

                    <button
                      className="ann-item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(ann.id);
                      }}
                      title="Delete defect box"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button Card */}
          <button 
            className="studio-save-commit-btn"
            onClick={handleSave}
          >
            <Check size={18} />
            <span>Save & Apply to Recipe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
