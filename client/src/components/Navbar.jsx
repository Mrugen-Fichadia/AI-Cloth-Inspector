import React from 'react';
import { 
  Camera, 
  Tag, 
  Cpu, 
  History, 
  Settings, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  onLogout, 
  activeModel, 
  soundEnabled, 
  setSoundEnabled,
  onOpenSettings,
  hasApiKey
}) {
  const tabs = [
    { id: 'live', label: 'Live Inspection HUD', icon: Camera },
    { id: 'annotation', label: 'Dataset & Annotate', icon: Tag },
    { id: 'training', label: 'Model Training', icon: Cpu },
    { id: 'history', label: 'QA History Logs', icon: History },
  ];

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand */}
        <div className="brand-group" onClick={() => setCurrentTab('live')}>
          <div className="brand-logo-glow">
            <Sparkles className="brand-icon" size={22} />
          </div>
          <div>
            <div className="brand-title">
              WABRIC <span className="brand-sub">AI</span>
            </div>
            <div className="brand-tagline">CLOTH DEFECT INSPECTOR</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <Icon size={18} className="tab-icon" />
                <span>{tab.label}</span>
                {isActive && <div className="tab-active-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Right Section / Telemetry & User */}
        <div className="navbar-actions">
          {/* Active Model Pill */}
          <div className="model-chip" title="Active Inspection Model">
            <Zap size={14} className="model-chip-icon" />
            <span className="model-name">{activeModel?.name || 'Base-V1'}</span>
            <span className="model-badge">LIVE</span>
          </div>

          {/* Sound Toggle */}
          <button 
            className={`icon-action-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute QA Audio Alarms' : 'Enable QA Audio Alarms'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Settings Trigger */}
          <button 
            className="icon-action-btn settings-btn"
            onClick={onOpenSettings}
            title="Configure AI & Gemini Settings"
          >
            <Settings size={18} />
            {hasApiKey && <span className="api-key-dot" title="Google Gemini AI Active" />}
          </button>

          {/* Operator Profile */}
          <div className="operator-chip">
            <div className="operator-avatar">
              <ShieldCheck size={16} />
            </div>
            <div className="operator-info">
              <div className="operator-name">{user?.name || 'Operator'}</div>
              <div className="operator-role">{user?.role || 'QC Inspector'}</div>
            </div>
            <button 
              className="logout-mini-btn" 
              onClick={onLogout}
              title="Logout Session"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
