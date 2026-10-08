import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import LiveInspectionHUD from './components/LiveInspectionHUD';
import AnnotationStudio from './components/AnnotationStudio';
import ModelTrainingCenter from './components/ModelTrainingCenter';
import InspectionHistoryView from './components/InspectionHistoryView';
import SettingsModal from './components/SettingsModal';
import RecipesView from './components/RecipesView';
import WorkstationsView from './components/WorkstationsView';
import ResultsView from './components/ResultsView';
import './App.css';

export default function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wabric_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation State (Default to 'home' matching Home_2.png)
  const [currentTab, setCurrentTab] = useState('home');

  // Sub-view inside recipes ('recipes' | 'annotation' | 'training')
  const [recipesSubView, setRecipesSubView] = useState('recipes');
  const [navbarLeftContent, setNavbarLeftContent] = useState(null);
  const [inspectingWorkstation, setInspectingWorkstation] = useState(null);

  // AI & Model State
  const [activeModel, setActiveModel] = useState({
    id: 'model-base-v1',
    name: 'Wabric-Fabric-Base (Pretrained)',
    version: '1.0.0',
    type: 'Hybrid-Gemini-Vision',
    accuracy: 94.6,
    classes: ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread']
  });
  const [models, setModels] = useState([]);
  const [dataset, setDataset] = useState([]);
  const [history, setHistory] = useState([]);

  // Settings & Gemini API Key State
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('wabric_gemini_key') || '';
  });
  const [geminiModel, setGeminiModel] = useState('gemini-3.1-flash-lite');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.60);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Staging for sending frames from HUD to Annotation Studio
  const [stagedAnnotationFrame, setStagedAnnotationFrame] = useState(null);
  const [stagedAnnotations, setStagedAnnotations] = useState([]);

  // Proportional scaling for 1920 x 1080 design baseline across all pages
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 1920;
      const currentWidth = window.innerWidth;

      if (currentWidth >= 900) {
        // Proportional scale factor for 1920x1080 baseline
        const scale = Math.min(Math.max(currentWidth / baseWidth, 0.5), 1.25);
        document.documentElement.style.setProperty('--app-scale', scale);
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight / scale}px`);
        document.body.style.zoom = scale;
      } else {
        // Mobile / Small tablet screens fallback to unzoomed responsive layout
        document.documentElement.style.setProperty('--app-scale', 1);
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
        document.body.style.zoom = 1;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.zoom = 1;
    };
  }, []);

  // Fetch initial data from server
  useEffect(() => {
    fetch('/api/dataset')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.dataset) setDataset(data.dataset);
      })
      .catch(err => console.debug('Offline dataset fallback:', err));

    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.models) {
          setModels(data.models);
          const active = data.models.find(m => m.isActive) || data.models[0];
          if (active) setActiveModel(active);
        }
      })
      .catch(err => console.debug('Offline models fallback:', err));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.geminiApiKey && !geminiApiKey) {
          setGeminiApiKey(data.geminiApiKey);
        }
        if (data.modelName) {
          const sanitized = (data.modelName.includes('1.5') || data.modelName.includes('2.0') || data.modelName.includes('flash-latest')) ? 'gemini-3.1-flash-lite' : data.modelName;
          setGeminiModel(sanitized);
        }
        if (data.confidenceThreshold) setConfidenceThreshold(data.confidenceThreshold);
      })
      .catch(err => console.debug('Offline settings fallback:', err));

    try {
      const savedHist = localStorage.getItem('wabric_inspection_results');
      if (savedHist) {
        const parsed = JSON.parse(savedHist);
        if (Array.isArray(parsed) && parsed.length > 0) setHistory(parsed);
      }
    } catch(e) {}

    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
          setHistory(prev => {
            const serverIds = new Set(data.history.map(h => h.id));
            const merged = [...data.history, ...prev.filter(p => !serverIds.has(p.id))];
            return merged.slice(0, 50);
          });
        }
      })
      .catch(err => console.debug('Offline history fallback:', err));
  }, []);

  // Handle Login / Logout
  const handleLogin = (operator) => {
    setUser(operator);
    localStorage.setItem('wabric_user', JSON.stringify(operator));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wabric_user');
  };

  // Handle API Key Save
  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('wabric_gemini_key', key);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geminiApiKey: key, modelName: geminiModel, confidenceThreshold })
    }).catch(err => console.warn('Could not persist key to server:', err));
  };

  // Handle Adding Samples to Dataset
  const handleSaveSample = async (sampleData) => {
    try {
      const response = await fetch('/api/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });
      const data = await response.json();
      if (data.success && data.sample) {
        setDataset([data.sample, ...dataset]);
      }
    } catch (err) {
      const localSample = {
        id: `sample-loc-${Date.now()}`,
        ...sampleData,
        createdAt: new Date().toISOString(),
        thumbnail: sampleData.image
      };
      setDataset([localSample, ...dataset]);
    }
  };

  // Handle Delete Sample
  const handleDeleteSample = async (sampleId) => {
    try {
      await fetch(`/api/dataset/${sampleId}`, { method: 'DELETE' });
    } catch (e) {}
    setDataset(dataset.filter(s => s.id !== sampleId));
  };

  // Handle Model Trained
  const handleModelTrained = (newModel) => {
    setModels([newModel, ...models.map(m => ({ ...m, isActive: false }))]);
    setActiveModel(newModel);
  };

  // Activate Model
  const handleActivateModel = async (modelId) => {
    try {
      await fetch('/api/models/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
    } catch (e) {}
    setModels(models.map(m => ({ ...m, isActive: m.id === modelId })));
    const target = models.find(m => m.id === modelId);
    if (target) setActiveModel(target);
  };

  // Handle Model Deleted
  const handleModelDeleted = (updatedModels) => {
    setModels(updatedModels);
    const active = updatedModels.find(m => m.isActive) || updatedModels[0];
    if (active) setActiveModel(active);
  };

  // Send Frame from Live HUD to Annotation Studio
  const handleSendToAnnotation = (frameData, defectBoxes) => {
    setStagedAnnotationFrame(frameData);
    setStagedAnnotations(defectBoxes || []);
    setCurrentTab('recipes');
    setRecipesSubView('annotation');
  };

  // Log Inspection Result & Persist
  const handleLogInspection = (scanData) => {
    setHistory(prev => {
      const updated = [scanData, ...prev.filter(item => item.id !== scanData.id).slice(0, 49)];
      try {
        localStorage.setItem('wabric_inspection_results', JSON.stringify(updated.slice(0, 30)));
      } catch(e) {}
      return updated;
    });

    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanData)
    }).catch(err => console.debug('History sync error:', err));
  };

  // Clear Inspection History & Sync with history.json
  const handleClearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (err) {
      console.warn('History clear server error:', err);
    }
    setHistory([]);
    try {
      localStorage.removeItem('wabric_inspection_results');
    } catch (e) {}
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setInspectingWorkstation(null);
    if (tabId === 'recipes') {
      setRecipesSubView('recipes');
    } else {
      setNavbarLeftContent(null);
    }
  };

  // Render Login if not authenticated
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="wabric-app-layout">
      {/* Left Sidebar (Matching Home_2 & Home_3) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <div className="wabric-main-stage">
        {/* Top Navbar */}
        <TopNavbar
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          leftContent={
            (currentTab === 'recipes' && recipesSubView === 'recipes') ||
            (currentTab === 'workstations' && !inspectingWorkstation) ||
            currentTab === 'results'
              ? navbarLeftContent
              : null
          }
        />

        {/* Dynamic Page Views */}
        <main className="wabric-content-scroll">
          {currentTab === 'home' && (
            <HomeView
              onStartInspection={() => {
                setInspectingWorkstation({
                  id: 'ws-1',
                  name: 'Fabric Inspection 01',
                  recipe: 'Colored Cotton',
                  itemNumber: '568124',
                  type: 'Cobot'
                });
                setCurrentTab('workstations');
              }}
              history={history}
              dataset={dataset}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              history={history}
              activeModel={activeModel}
            />
          )}

          {currentTab === 'workstations' && (
            <WorkstationsView
              setNavbarLeftContent={setNavbarLeftContent}
              onInspectWorkstation={(ws) => setInspectingWorkstation(ws)}
            />
          )}

          {currentTab === 'recipes' && (
            <div className="recipes-tab-wrapper">
              {recipesSubView === 'recipes' && (
                <RecipesView
                  setNavbarLeftContent={setNavbarLeftContent}
                  dataset={dataset}
                  onSaveSample={handleSaveSample}
                  onModelTrained={handleModelTrained}
                  onDatasetUpdated={(newDs) => setDataset(newDs)}
                  activeModel={activeModel}
                  onOpenAnnotationStudio={(imgSrc, annotations) => {
                    setStagedAnnotationFrame(imgSrc);
                    setStagedAnnotations(annotations || []);
                    setRecipesSubView('annotation');
                  }}
                  onOpenTrainingCenter={() => {
                    setRecipesSubView('training');
                  }}
                  onDeployModel={(recipe) => {
                    handleActivateModel('model-edge-flint-v2');
                    alert(`Model successfully deployed for ${recipe.name} to Workstation 01!`);
                  }}
                />
              )}

              {recipesSubView === 'annotation' && (
                <AnnotationStudio
                  dataset={dataset}
                  onSaveSample={(savedSample) => {
                    handleSaveSample(savedSample);
                    // Also switch back to recipes view after saving
                    setRecipesSubView('recipes');
                  }}
                  onDeleteSample={handleDeleteSample}
                  onNavigateToTraining={() => setRecipesSubView('training')}
                  onBack={() => setRecipesSubView('recipes')}
                  initialImage={stagedAnnotationFrame}
                  initialAnnotations={stagedAnnotations}
                />
              )}

              {recipesSubView === 'training' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      className="recipe-back-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', width: 'auto' }}
                      onClick={() => setRecipesSubView('recipes')}
                    >
                      ← Back to Recipes
                    </button>
                  </div>
                  <ModelTrainingCenter
                    dataset={dataset}
                    models={models}
                    activeModel={activeModel}
                    onModelTrained={handleModelTrained}
                    onActivateModel={handleActivateModel}
                    onModelDeleted={handleModelDeleted}
                    onGoToLiveInspection={() => setCurrentTab('workstations')}
                    onDatasetUpdated={(newDs) => setDataset(newDs)}
                  />
                </div>
              )}
            </div>
          )}

          {currentTab === 'results' && (
            <ResultsView 
              setNavbarLeftContent={setNavbarLeftContent} 
              history={history}
              onClearHistory={handleClearHistory}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={handleSaveApiKey}
        modelName={geminiModel}
        onChangeModel={setGeminiModel}
        confidenceThreshold={confidenceThreshold}
        onChangeConfidence={setConfidenceThreshold}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        activeModel={activeModel}
      />

      {/* Global Live Inspection Screen (Fullscreen by default, Popup when shrinked) */}
      {inspectingWorkstation && (
        <LiveInspectionHUD
          workstation={inspectingWorkstation}
          onClose={() => setInspectingWorkstation(null)}
          soundEnabled={soundEnabled}
          geminiApiKey={geminiApiKey}
          geminiModel={geminiModel}
          activeModel={activeModel}
          onLogInspection={handleLogInspection}
        />
      )}
    </div>
  );
}
