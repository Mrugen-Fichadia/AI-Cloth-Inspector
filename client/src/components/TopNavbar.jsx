import React, { useState, useRef, useEffect } from 'react';
import searchIcon from '../assets/icons/search_icon.svg';
import notificationIcon from '../assets/icons/notification_icon.svg';
import { Settings, LogOut } from 'lucide-react';

export default function TopNavbar({ user, onLogout, onOpenSettings, leftContent }) {
  const [searchValue, setSearchValue] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className="wabric-top-navbar">
      <div className="top-navbar-left-area">
        {leftContent}
      </div>

      {/* Right Controls: Search, Notification, Profile */}
      <div className="top-navbar-controls">
        {/* Search Bar */}
        <div className="top-search-wrapper">
          <input
            type="text"
            placeholder="Search 'RX Board'"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="top-search-input"
          />
          <img src={searchIcon} alt="Search" className="top-search-icon" />
        </div>

        {/* Notification Bell */}
        <button 
          className="top-icon-btn" 
          title="Notifications"
          onClick={() => alert('No new notifications. All inspection lines running normally.')}
        >
          <img src={notificationIcon} alt="Notification" className="top-bell-icon" />
        </button>

        {/* User Initials Avatar Circle & Profile Dropdown */}
        <div className="profile-menu-container" ref={profileMenuRef}>
          <button
            className="top-avatar-circle"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={`${user?.name || 'Rajat Saini'} (${user?.role || 'Quality Lead'})`}
          >
            {user?.initials || 'RS'}
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-info">
                <div className="dropdown-user-name">{user?.name || 'Rajat Saini'}</div>
                <div className="dropdown-user-email">{user?.email || 'Rajat.saini@wabric.com'}</div>
                {user?.role && <div className="dropdown-user-role">{user.role}</div>}
              </div>
              <div className="dropdown-divider" />
              <button 
                className="dropdown-item-btn"
                onClick={() => { setShowProfileMenu(false); onOpenSettings(); }}
              >
                <Settings size={18} />
                <span>AI & Model Settings</span>
              </button>
              <button 
                className="dropdown-item-btn danger"
                onClick={() => { setShowProfileMenu(false); onLogout(); }}
              >
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
