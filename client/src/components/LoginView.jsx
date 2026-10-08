import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import eyeIcon from '../assets/icons/eye_open.svg';
import keyIcon from '../assets/icons/key_icon.svg';
import helpIcon from '../assets/icons/help_icon.svg';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('Rajat.saini@wabric.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      id: 'usr-001',
      name: 'Rajat Saini',
      initials: 'RS',
      email: email,
      role: 'Quality Lead'
    });
  };

  const handleSSOLogin = () => {
    onLogin({
      id: 'usr-sso',
      name: 'Rajat Saini',
      initials: 'RS',
      email: 'Rajat.saini@wabric.com',
      role: 'Enterprise SSO User'
    });
  };

  return (
    <div className="login-screen-root">
      {/* Central Login Container */}
      <div className="login-box-center">
        {/* Brand Logo */}
        <div className="login-logo-wrap">
          <img src={logoImg} alt="Wabric Logo" className="login-wabric-logo" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="wabric-login-form">
          {/* Email Field */}
          <div className="login-input-group">
            <label className="login-field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-text-input"
              required
            />
          </div>

          {/* Password Field */}
          <div className="login-input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-text-input password-input"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <img src={eyeIcon} alt="Toggle visibility" className="eye-icon-img" />
            </button>
          </div>

          {/* Log in Button */}
          <button type="submit" className="login-primary-btn">
            Log in
          </button>

          {/* Forgot Password */}
          <div className="forgot-password-wrap">
            <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email.'); }}>
              Forgot Password?
            </a>
          </div>

          {/* Log in with SSO */}
          <button type="button" onClick={handleSSOLogin} className="login-sso-btn">
            <img src={keyIcon} alt="SSO Key" className="sso-key-icon" />
            <span>Log in with SSO</span>
          </button>
        </form>
      </div>

      {/* Bottom Right Floating Help Badge */}
      <div className="login-help-badge" onClick={() => alert('Support line: support@wabric.com | Available 24/7')}>
        <img src={helpIcon} alt="Help" className="help-icon-circle" />
        <div className="help-text-stack">
          <span className="having-trouble-text">Having Trouble?</span>
          <span className="contact-us-text">Contact Us!</span>
        </div>
      </div>
    </div>
  );
}
