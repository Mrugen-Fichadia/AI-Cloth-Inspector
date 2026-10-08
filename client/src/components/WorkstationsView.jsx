import React, { useState, useEffect } from 'react';
import addIcon from '../assets/icons/add_icon.svg';
import verticalDotsIcon from '../assets/icons/vertical_dots.svg';
import cancelIcon from '../assets/icons/cancel_icon.svg';
import arrowDownCurved from '../assets/icons/arrow_down_curved.svg';
import { Plus, Check } from 'lucide-react';

export default function WorkstationsView({
  setNavbarLeftContent,
  onInspectWorkstation
}) {
  // Initial Workstations matching Image 1
  const [workstations, setWorkstations] = useState([
    {
      id: 'ws-1',
      type: 'Cobot',
      name: 'Fabric Inspection 01',
      cameraCount: '03',
      recipe: 'Colored Cotton',
      itemNumber: '568124',
      publishedDate: '27 May 2026',
      status: 'Active',
      cameraName: 'Overhead Optical HD',
      cameraAddress: 'rtsp://192.168.1.101:554/live'
    },
    {
      id: 'ws-2',
      type: 'Conveyor',
      name: 'Fabric Inspection 01',
      cameraCount: '03',
      recipe: 'Colored Cotton',
      itemNumber: '568124',
      publishedDate: '27 May 2026',
      status: 'Active',
      cameraName: 'Line Scan 4K',
      cameraAddress: 'rtsp://192.168.1.102:554/live'
    },
    {
      id: 'ws-3',
      type: 'Static',
      name: 'Fabric Inspection 01',
      cameraCount: '03',
      recipe: 'Colored Cotton',
      itemNumber: '568124',
      publishedDate: '27 May 2026',
      status: 'Active',
      cameraName: 'Boomer 1080p',
      cameraAddress: 'rtsp://192.168.1.103:554/live'
    },
    {
      id: 'ws-4',
      type: 'Cobot',
      name: 'Fabric Inspection 01',
      cameraCount: '03',
      recipe: 'Colored Cotton',
      itemNumber: '568124',
      publishedDate: '27 May 2026',
      status: 'Active',
      cameraName: 'Angle Side Camera',
      cameraAddress: 'rtsp://192.168.1.104:554/live'
    }
  ]);

  // Filter type: 'all' | 'active' | 'inactive'
  const [filterType, setFilterType] = useState('all');

  // Active dots menu popup ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Side drawer state (Image 2)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [wsType, setWsType] = useState('');
  const [cameraName, setCameraName] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraAddress, setCameraAddress] = useState('');

  // Dropdown open states
  const [isRecipeDropdownOpen, setIsRecipeDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);

  // Additional cameras list
  const [camerasList, setCamerasList] = useState([]);

  // Counts
  const activeCount = workstations.filter(w => w.status === 'Active').length;
  const inactiveCount = workstations.filter(w => w.status === 'In-Active').length;

  const filteredWorkstations = workstations.filter(w => {
    if (filterType === 'active') return w.status === 'Active';
    if (filterType === 'inactive') return w.status === 'In-Active';
    return true;
  });

  // Synchronize Top Navbar Left Content (Matching Image 1)
  useEffect(() => {
    if (!setNavbarLeftContent) return;

    setNavbarLeftContent(
      <div className="workstations-header-left-group">
        <h1 className="workstations-main-heading">
          Workstations ({workstations.length.toString().padStart(2, '0')})
        </h1>

        {/* Legend 1: Dot #59C4B3 - Active (00) */}
        <div
          className={`workstation-legend-item clickable ${filterType === 'active' ? 'active' : ''}`}
          onClick={() => setFilterType(prev => prev === 'active' ? 'all' : 'active')}
        >
          <span className="legend-dot" style={{ backgroundColor: '#59C4B3' }}></span>
          <span className="workstation-filter-label">Active</span>
          <span className="workstation-filter-count">({activeCount.toString().padStart(2, '0')})</span>
        </div>

        {/* Legend 2: Dot #ED9566 - In-Active (00) */}
        <div
          className={`workstation-legend-item clickable ${filterType === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilterType(prev => prev === 'inactive' ? 'all' : 'inactive')}
        >
          <span className="legend-dot" style={{ backgroundColor: '#ED9566' }}></span>
          <span className="workstation-filter-label">In-Active</span>
          <span className="workstation-filter-count">({inactiveCount.toString().padStart(2, '0')})</span>
        </div>
      </div>
    );

    return () => {
      setNavbarLeftContent(null);
    };
  }, [workstations, filterType, activeCount, inactiveCount, setNavbarLeftContent]);

  // Handle Clear Drawer Form
  const handleClearDrawer = () => {
    setWsName('');
    setSelectedRecipe('');
    setWsType('');
    setCameraName('');
    setSelectedCamera('');
    setCameraAddress('');
    setCamerasList([]);
    setIsRecipeDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setIsCameraDropdownOpen(false);
  };

  // Handle Add Camera item
  const handleAddCameraClick = () => {
    setCamerasList(prev => [
      ...prev,
      {
        id: `cam-${Date.now()}`,
        name: cameraName || `Camera ${prev.length + 2}`,
        type: selectedCamera || 'Overhead Optical HD',
        address: cameraAddress || 'rtsp://192.168.1.105:554/live'
      }
    ]);
    setCameraName('');
    setCameraAddress('');
  };

  // Handle Create Workstation
  const handleCreateWorkstation = (e) => {
    e.preventDefault();
    const newWs = {
      id: `ws-${Date.now()}`,
      type: wsType || 'Cobot',
      name: wsName.trim() || `Fabric Inspection ${String(workstations.length + 1).padStart(2, '0')}`,
      cameraCount: String(camerasList.length + (cameraName || selectedCamera ? 1 : 1)).padStart(2, '0'),
      recipe: selectedRecipe || 'Colored Cotton',
      publishedDate: '27 May 2026',
      status: 'Active',
      cameraName: cameraName || selectedCamera || 'Overhead Optical HD',
      cameraAddress: cameraAddress || 'rtsp://192.168.1.100:554/live'
    };

    setWorkstations(prev => [...prev, newWs]);
    handleClearDrawer();
    setIsAddDrawerOpen(false);
  };

  // Handle Delete Workstation
  const handleDeleteWorkstation = (id, e) => {
    e.stopPropagation();
    setWorkstations(prev => prev.filter(w => w.id !== id));
    setActiveMenuId(null);
  };

  return (
    <div className="workstations-view-root">
      {/* Top Action Bar: Workstation + */}
      <div className="workstations-action-bar-row">
        <button
          className="workstation-add-btn"
          onClick={() => setIsAddDrawerOpen(true)}
        >
          Workstation
          <img src={addIcon} alt="Add" className="workstation-btn-plus-icon" />
        </button>
      </div>

      {/* =====================================================================
          IMAGE 1: WORKSTATION CARDS GRID (380 x 272)
         ===================================================================== */}
      <div className="workstations-cards-grid">
        {filteredWorkstations.map((ws) => (
          <div key={ws.id} className="workstation-item-card-380x272">
            {/* Top Row: Type on Left, Dots Menu on Right */}
            <div className="workstation-card-top-row">
              {/* "Cobot" is normal 16 , #0C18C0 */}
              <span className="workstation-type-label">{ws.type}</span>

              {/* Vertical Dots Button */}
              <div className="workstation-card-dots-wrap">
                <button
                  type="button"
                  className="workstation-dots-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === ws.id ? null : ws.id);
                  }}
                >
                  <img src={verticalDotsIcon} alt="Options" className="vertical-dots-icon-img" />
                </button>

                {activeMenuId === ws.id && (
                  <div className="workstation-card-popover-menu" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="popover-item"
                      onClick={() => {
                        setActiveMenuId(null);
                        if (onInspectWorkstation) onInspectWorkstation(ws);
                      }}
                    >
                      Inspect Live
                    </button>
                    <button
                      type="button"
                      className="popover-item"
                      onClick={(e) => handleDeleteWorkstation(ws.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Title: "Fabric Inspection 01" semibold 18, #292931 */}
            <h3 className="workstation-card-name-title">{ws.name}</h3>

            {/* Middle Stats Row: Camera Count & Recipe Name */}
            <div className="workstation-card-stats-row">
              <div className="workstation-stat-col">
                {/* "03" semibold 18, #292931 */}
                <div className="workstation-stat-val">{ws.cameraCount}</div>
                {/* "Camera" normal 14, #69696E */}
                <div className="workstation-stat-lbl">Camera</div>
              </div>

              <div className="workstation-stat-divider"></div>

              <div className="workstation-stat-col">
                <div className="workstation-stat-val text-truncate">{ws.recipe}</div>
                {/* "Recipe" normal 14, #69696E */}
                <div className="workstation-stat-lbl">Recipe</div>
              </div>
            </div>

            {/* Bottom Row: Metadata & Inspect Button */}
            <div className="workstation-card-bottom-row">
              <div className="workstation-meta-col">
                <div className="workstation-published-line">
                  {/* "Published:" normal 14, #69696E */}
                  <span className="workstation-pub-lbl">Published: </span>
                  {/* "27 May 2026" semibold 14, #292931 */}
                  <span className="workstation-pub-val">{ws.publishedDate}</span>
                </div>
                {/* "Active" medium 14, #249785 */}
                <div className={`workstation-status-text ${ws.status === 'Active' ? 'active' : 'inactive'}`}>
                  {ws.status}
                </div>
              </div>

              {/* Inspect button is 101 x 48, "Inspect" medium 16 */}
              <button
                type="button"
                className="workstation-inspect-btn-101x48"
                onClick={() => {
                  if (onInspectWorkstation) onInspectWorkstation(ws);
                }}
              >
                Inspect
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================================
          IMAGE 2: ADD WORKSTATION SIDE DRAWER (892px width, 24px padding)
         ===================================================================== */}
      {isAddDrawerOpen && (
        <div className="add-workstation-drawer-backdrop" onClick={() => setIsAddDrawerOpen(false)}>
          <div
            className="add-workstation-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header: "Add Workstation" medium 18 */}
            <div className="workstation-drawer-header">
              <h2 className="workstation-drawer-title">Add Workstation</h2>
              <button
                type="button"
                className="workstation-drawer-close-btn"
                onClick={() => setIsAddDrawerOpen(false)}
                title="Close"
              >
                <img src={cancelIcon} alt="Close" className="drawer-close-svg" />
              </button>
            </div>

            {/* Drawer Body Form: Vertical gap between each item 24 */}
            <form onSubmit={handleCreateWorkstation} className="workstation-drawer-form">
              {/* Item 1: "Workstation Name" textbox size 844 x 56, fontsize: normal 18 */}
              <div className="drawer-field-row full-width">
                <input
                  type="text"
                  placeholder="Workstation Name"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="drawer-input-844x56"
                  required
                />
              </div>

              {/* Item 2: Two-column row for Select Recipe & Workstation Type */}
              <div className="drawer-two-col-grid">
                {/* Select Recipe Dropdown */}
                <div className="drawer-select-wrapper">
                  <div
                    className={`drawer-select-field ${isRecipeDropdownOpen ? 'open' : ''}`}
                    onClick={() => {
                      setIsRecipeDropdownOpen(!isRecipeDropdownOpen);
                      setIsTypeDropdownOpen(false);
                      setIsCameraDropdownOpen(false);
                    }}
                  >
                    <span className={selectedRecipe ? 'drawer-select-val' : 'drawer-select-ph'}>
                      {selectedRecipe || 'Select Recipe'}
                    </span>
                    <img src={arrowDownCurved} alt="Dropdown" className="drawer-curved-arrow" />
                  </div>

                  {isRecipeDropdownOpen && (
                    <div className="drawer-options-menu">
                      {['Colored Cotton', 'Cotton Fabric', 'Valvet Fabric', 'Hue Fabric'].map((rec) => (
                        <div
                          key={rec}
                          className={`drawer-option-item ${selectedRecipe === rec ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedRecipe(rec);
                            setIsRecipeDropdownOpen(false);
                          }}
                        >
                          <span>{rec}</span>
                          {selectedRecipe === rec && <Check size={16} color="#0A5DE9" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workstation Type Dropdown */}
                <div className="drawer-select-wrapper">
                  <div
                    className={`drawer-select-field ${isTypeDropdownOpen ? 'open' : ''}`}
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen);
                      setIsRecipeDropdownOpen(false);
                      setIsCameraDropdownOpen(false);
                    }}
                  >
                    <span className={wsType ? 'drawer-select-val' : 'drawer-select-ph'}>
                      {wsType || 'Workstation Type'}
                    </span>
                    <img src={arrowDownCurved} alt="Dropdown" className="drawer-curved-arrow" />
                  </div>

                  {isTypeDropdownOpen && (
                    <div className="drawer-options-menu">
                      {['Cobot', 'Conveyor', 'Static'].map((type) => (
                        <div
                          key={type}
                          className={`drawer-option-item ${wsType === type ? 'selected' : ''}`}
                          onClick={() => {
                            setWsType(type);
                            setIsTypeDropdownOpen(false);
                          }}
                        >
                          <span>{type}</span>
                          {wsType === type && <Check size={16} color="#0A5DE9" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Item 3: "Add camera" button 166 x 56, fontsize: normal 18 */}
              <div className="drawer-field-row">
                <button
                  type="button"
                  className="add-camera-btn-166x56"
                  onClick={handleAddCameraClick}
                >
                  <Plus size={18} />
                  Add Camera
                </button>
              </div>

              {/* Item 4: Two-column row for Camera Name & Select Camera */}
              <div className="drawer-two-col-grid">
                {/* Camera Name Textbox */}
                <div className="drawer-input-wrapper">
                  <input
                    type="text"
                    placeholder="Camera Name"
                    value={cameraName}
                    onChange={(e) => setCameraName(e.target.value)}
                    className="drawer-input-half"
                  />
                </div>

                {/* Select Camera Dropdown */}
                <div className="drawer-select-wrapper">
                  <div
                    className={`drawer-select-field ${isCameraDropdownOpen ? 'open' : ''}`}
                    onClick={() => {
                      setIsCameraDropdownOpen(!isCameraDropdownOpen);
                      setIsRecipeDropdownOpen(false);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    <span className={selectedCamera ? 'drawer-select-val' : 'drawer-select-ph'}>
                      {selectedCamera || 'Select Camera'}
                    </span>
                    <img src={arrowDownCurved} alt="Dropdown" className="drawer-curved-arrow" />
                  </div>

                  {isCameraDropdownOpen && (
                    <div className="drawer-options-menu">
                      {['Overhead Optical HD', 'Angle Side Camera', 'Line Scan 4K', 'Boomer 1080p'].map((cam) => (
                        <div
                          key={cam}
                          className={`drawer-option-item ${selectedCamera === cam ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCamera(cam);
                            setIsCameraDropdownOpen(false);
                          }}
                        >
                          <span>{cam}</span>
                          {selectedCamera === cam && <Check size={16} color="#0A5DE9" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Item 5: Camera Address Textbox */}
              <div className="drawer-two-col-grid">
                <div className="drawer-input-wrapper">
                  <input
                    type="text"
                    placeholder="Camera Address"
                    value={cameraAddress}
                    onChange={(e) => setCameraAddress(e.target.value)}
                    className="drawer-input-half"
                  />
                </div>
              </div>

              {/* Dynamic Added Cameras List if any */}
              {camerasList.length > 0 && (
                <div className="drawer-cameras-list-block">
                  <div className="drawer-cameras-count-tag">
                    {camerasList.length} Additional Camera(s) Configured
                  </div>
                </div>
              )}

              {/* Item 6: Drawer Footer Action Buttons (Clear & Create) */}
              <div className="workstation-drawer-footer">
                <button
                  type="button"
                  className="drawer-clear-btn-188x48"
                  onClick={handleClearDrawer}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="drawer-create-btn-188x48"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
