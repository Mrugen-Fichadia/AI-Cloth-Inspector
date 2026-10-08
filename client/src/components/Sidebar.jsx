import React from 'react';
import logoImg from '../assets/logo.png';
import menuHome from '../assets/icons/menu_home.svg';
import menuDashboard from '../assets/icons/menu_dashboard.svg';
import menuRecipes from '../assets/icons/menu_recipes.svg';
import menuWorkstations from '../assets/icons/menu_workstations.svg';
import menuResults from '../assets/icons/menu_results.svg';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: menuHome },
    { id: 'dashboard', label: 'Dashboard', icon: menuDashboard },
    { id: 'recipes', label: 'Recipes', icon: menuRecipes },
    { id: 'workstations', label: 'Workstations', icon: menuWorkstations },
    { id: 'results', label: 'Results', icon: menuResults },
  ];

  return (
    <aside className="wabric-sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-logo-header" onClick={() => setCurrentTab('home')}>
        <img src={logoImg} alt="Wabric" className="sidebar-brand-logo" />
      </div>

      {/* Navigation Menu Items */}
      <nav className="sidebar-nav-list">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <img src={item.icon} alt={item.label} className="nav-item-icon" />
              <span className="nav-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Used Space Card */}
      <div className="sidebar-used-space-card">
        <div className="used-space-title">Used Space</div>
        <p className="used-space-sub">
          You have used 20% of yours available space
        </p>
        <div className="used-space-progress-track">
          <div className="used-space-progress-bar" style={{ width: '20%' }} />
        </div>
        <div className="used-space-metric-row">
          <span className="used-space-metric-val">20 GB</span>
          <span className="used-space-metric-total"> / 100.0 GB</span>
        </div>
      </div>
    </aside>
  );
}
