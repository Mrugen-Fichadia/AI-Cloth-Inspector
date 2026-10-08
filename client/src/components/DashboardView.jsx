import React, { useState } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';

export default function DashboardView({ history, activeModel }) {
  const [defectFilter, setDefectFilter] = useState('major'); // 'major' | 'minor'

  const majorDefects = [
    { label: 'Roughness (80%)', count: '59,799', percent: 80, gradient: 'linear-gradient(90deg, #4338CA 0%, #7E22CE 60%, #BE185D 100%)' },
    { label: 'Star Edge Crack (55%)', count: '32,799', percent: 55, gradient: 'linear-gradient(90deg, #4338CA 0%, #7E22CE 100%)' },
    { label: 'Surface Chips (30%)', count: '16,567', percent: 30, gradient: 'linear-gradient(90deg, #4338CA 0%, #6366F1 100%)' },
    { label: 'Surface Finish (10%)', count: '4580', percent: 10, gradient: 'linear-gradient(90deg, #4338CA 0%, #6366F1 100%)' },
    { label: 'Pinholes (70%)', count: '42,799', percent: 70, gradient: 'linear-gradient(90deg, #4338CA 0%, #7E22CE 60%, #9D174D 100%)' },
    { label: 'Dent (45%)', count: '20,567', percent: 45, gradient: 'linear-gradient(90deg, #4338CA 0%, #6366F1 100%)' },
  ];

  const minorDefects = [
    { label: 'Color Bleed (40%)', count: '14,210', percent: 40, gradient: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' },
    { label: 'Weft Distortion (35%)', count: '12,450', percent: 35, gradient: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' },
    { label: 'Minor Lint (25%)', count: '8,900', percent: 25, gradient: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' },
    { label: 'Loose Thread (15%)', count: '5,300', percent: 15, gradient: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)' },
  ];

  const currentDefects = defectFilter === 'major' ? majorDefects : minorDefects;

  return (
    <div className="dashboard-view-container">
      {/* =========================================================================
          TOP ROW: 3 SUMMARY METRIC CARDS
         ========================================================================= */}
      <div className="dashboard-top-cards-row">
        {/* Card 1: Last Inspection Gauge */}
        <div className="dash-metric-card">
          <div className="dash-card-left-info">
            <span className="dash-card-sup-label">Last Inspection</span>
            <h3 className="dash-card-title">Colored Fabric</h3>
            <span className="dash-card-sub-code">MC0078HH009</span>
          </div>

          <div className="gauge-wrapper">
            <svg viewBox="0 0 160 100" className="semi-gauge-svg">
              {/* Background Arc Track */}
              <path
                d="M 20,90 A 60,60 0 0,1 140,90"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Pink & Blue Arc */}
              <path
                d="M 20,90 A 60,60 0 0,1 100,34"
                fill="none"
                stroke="#EC4899"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 100,34 A 60,60 0 0,1 140,90"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-big-num">720</span>
              <span className="gauge-label">Operating Hours</span>
            </div>
          </div>
        </div>

        {/* Card 2: Avg. Cycle Time */}
        <div className="dash-metric-card">
          <div className="dash-card-left-info">
            <div className="dash-sub-stat">
              <span className="dash-card-sup-label">Avg. Cycle Time</span>
              <div className="dash-stat-value">05 sec.</div>
            </div>
            <div className="dash-sub-stat mt-3">
              <span className="dash-card-sup-label">Production Yield</span>
              <div className="dash-stat-value">27%</div>
            </div>
          </div>

          <div className="gauge-wrapper">
            <svg viewBox="0 0 160 100" className="semi-gauge-svg">
              <path
                d="M 20,90 A 60,60 0 0,1 140,90"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 20,90 A 60,60 0 0,1 120,44"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-big-num">72%</span>
              <span className="gauge-label">Defect Rate</span>
            </div>
          </div>
        </div>

        {/* Card 3: Human Verification */}
        <div className="dash-metric-card">
          <div className="dash-card-left-info">
            <div className="dash-sub-stat">
              <span className="dash-card-sup-label">Human Verification</span>
              <div className="dash-stat-value">67%</div>
            </div>
            <div className="dash-sub-stat mt-3">
              <span className="dash-card-sup-label">Rework Parts</span>
              <div className="dash-stat-value">3446778</div>
            </div>
          </div>

          <div className="bar-comparison-wrapper">
            <div className="bar-col">
              <span className="bar-pct">78%</span>
              <div className="bar-rect-track">
                <div className="bar-rect-fill pass" style={{ height: '78%' }} />
              </div>
              <span className="bar-label">Pass</span>
            </div>

            <div className="bar-col">
              <span className="bar-pct">12%</span>
              <div className="bar-rect-track">
                <div className="bar-rect-fill fail" style={{ height: '12%' }} />
              </div>
              <span className="bar-label">Fail</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: Quality Inspection Spline Wave Chart + Defects Breakdown
         ========================================================================= */}
      <div className="dashboard-bottom-grid">
        {/* Left Card: Quality Inspection Area Chart */}
        <div className="dash-card quality-inspection-chart-card">
          <div className="chart-card-header">
            <div>
              <span className="dash-card-sup-label">Statistics</span>
              <h2 className="dash-card-main-title">Quality Inspection</h2>
            </div>

            {/* Badges */}
            <div className="quality-badges-row">
              <div className="quality-badge count-badge">
                <div className="badge-meta">
                  <span className="badge-lbl">Total Count</span>
                  <span className="badge-val">5600249</span>
                </div>
                <RefreshCw size={13} className="badge-icon-blue" />
              </div>

              <div className="quality-badge pass-badge">
                <div className="badge-meta">
                  <span className="badge-lbl">Accepted</span>
                  <span className="badge-val">5600249</span>
                </div>
                <Check size={14} className="badge-icon-green" />
              </div>

              <div className="quality-badge fail-badge">
                <div className="badge-meta">
                  <span className="badge-lbl">Rejected</span>
                  <span className="badge-val">5600249</span>
                </div>
                <X size={14} className="badge-icon-red" />
              </div>
            </div>
          </div>

          {/* SVG Smooth Spline Chart */}
          <div className="chart-svg-viewport">
            <svg viewBox="0 0 760 300" className="spline-svg-element">
              {/* Horizontal Grid lines */}
              <line x1="40" y1="40" x2="740" y2="40" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="100" x2="740" y2="100" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="160" x2="740" y2="160" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="220" x2="740" y2="220" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="280" x2="740" y2="280" stroke="#F3F4F6" strokeWidth="1" />

              {/* Y-Axis Labels */}
              <text x="15" y="44" fill="#9CA3AF" fontSize="11" fontFamily="sans-serif">8k</text>
              <text x="15" y="104" fill="#9CA3AF" fontSize="11" fontFamily="sans-serif">6k</text>
              <text x="15" y="164" fill="#9CA3AF" fontSize="11" fontFamily="sans-serif">4k</text>
              <text x="15" y="224" fill="#9CA3AF" fontSize="11" fontFamily="sans-serif">2k</text>
              <text x="22" y="284" fill="#9CA3AF" fontSize="11" fontFamily="sans-serif">0</text>

              {/* Green Accepted Wave Curve */}
              <path
                d="M 40,205 C 100,165 140,150 180,200 C 220,240 260,230 300,160 C 330,100 370,80 400,130 C 440,210 470,270 510,270 C 560,270 610,210 650,150 C 690,100 720,80 740,60"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              />

              {/* Red Rejected Wave Curve */}
              <path
                d="M 40,250 C 90,245 140,215 180,225 C 220,235 250,265 290,240 C 330,215 360,110 400,135 C 440,150 470,160 500,185 C 540,210 570,180 610,160 C 660,140 700,200 740,240"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
              />

              {/* Point Indicator on Accepted curve at 6 PM */}
              <circle cx="330" cy="94" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />

              {/* Point Indicator on Rejected curve */}
              <circle cx="180" cy="225" r="5" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2.5" />

              {/* 7067 Tooltip Badge over 6 PM */}
              <g transform="translate(305, 52)">
                <rect x="0" y="0" width="50" height="26" rx="6" fill="#0F172A" />
                <text x="25" y="17" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                  7067
                </text>
              </g>
            </svg>

            {/* X-Axis Timestamps */}
            <div className="chart-x-axis-labels">
              <span>00 PM</span>
              <span>1 PM</span>
              <span>2 PM</span>
              <span>3 PM</span>
              <span>4 PM</span>
              <span>5 PM</span>
              <span>6 PM</span>
              <span>7 PM</span>
              <span>8 PM</span>
              <span>9 PM</span>
              <span>10 PM</span>
              <span>11 PM</span>
              <span>12 AM</span>
            </div>
          </div>
        </div>

        {/* Right Card: Defects (12) Breakdown */}
        <div className="dash-card defects-breakdown-card">
          <div className="defects-card-header">
            <div>
              <span className="dash-card-sup-label">Statistics</span>
              <h2 className="dash-card-main-title">Defects (12)</h2>
            </div>

            {/* Major / Minor Pill Filter */}
            <div className="defects-toggle-pills">
              <button
                className={`toggle-pill-btn ${defectFilter === 'major' ? 'active' : ''}`}
                onClick={() => setDefectFilter('major')}
              >
                Major
              </button>
              <button
                className={`toggle-pill-btn ${defectFilter === 'minor' ? 'active' : ''}`}
                onClick={() => setDefectFilter('minor')}
              >
                Minor
              </button>
            </div>
          </div>

          {/* Horizontal Defect Bars */}
          <div className="defects-bars-list">
            {currentDefects.map((defect, i) => (
              <div key={i} className="defect-bar-item">
                <div className="defect-bar-meta">
                  <span className="defect-bar-label">{defect.label}</span>
                  <span className="defect-bar-count">{defect.count}</span>
                </div>
                <div className="defect-bar-track">
                  <div
                    className="defect-bar-fill"
                    style={{
                      width: `${defect.percent}%`,
                      background: defect.gradient
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Defect Axis Scale */}
          <div className="defects-scale-axis">
            <span>0</span>
            <span>15k</span>
            <span>30k</span>
            <span>45k</span>
            <span>60k</span>
          </div>
        </div>
      </div>
    </div>
  );
}
