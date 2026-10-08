import React from 'react';
import bluePlayBtn from '../assets/icons/blue_play_button.svg';
import whitePlayBtn from '../assets/icons/white_play_button.svg';
import arrowRight from '../assets/icons/arrow_right.svg';
import home1Img from '../assets/Home_1.png';
import home2Img from '../assets/Home_2.png';
import home3Img from '../assets/Home_3.png';
import { SAMPLE_FABRICS } from '../data/sampleFabrics';

export default function HomeView({ onStartInspection, history, dataset }) {
  const totalCount = history?.length || 0;
  const rejectedCount = history ? history.filter(h => h.status === 'FLAGGED').length : 0;
  const acceptedCount = history ? history.filter(h => h.status === 'PASSED').length : 0;

  return (
    <div className="home-view-container">
      {/* =========================================================================
          TOP BANNER: Tutorial - Set Up Your First Workstation
         ========================================================================= */}
      <div className="home-tutorial-banner">
        <div className="banner-left-content">
          <div className="banner-tutorial-tag">Tutorial</div>
          <h1 className="banner-main-title">Set Up Your First Workstation</h1>
          <p className="banner-desc-text">
            Set up your workstation to get started with garment inspection and
            quality control. Connect the required equipment, configure inspection
            settings, and make sure everything is ready for operation.
          </p>
          <button 
            className="banner-explore-pill-btn"
            onClick={onStartInspection}
          >
            <span>Explore</span>
            <img src={bluePlayBtn} alt="Play" className="banner-play-icon" />
          </button>
        </div>

        <div className="banner-right-video-cards">
          {/* Video Card 1 */}
          <div 
            className="tutorial-video-card" 
            onClick={() => alert('Tutorial: Place fabric smoothly beneath the workstation lens. Lighting should be uniform.')}
          >
            <div 
              className="video-card-thumb-area"
              style={{
                backgroundImage: `url(${home1Img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={whitePlayBtn} alt="Play Video" className="white-play-badge" />
            </div>
            <div className="video-card-caption">
              Start Inspection With<br></br>Static Workstation
            </div>
          </div>

          {/* Video Card 2 */}
          <div 
            className="tutorial-video-card"
            onClick={() => alert('Tutorial: Connect conveyor trigger to feed continuous rolls at up to 1.5 m/s.')}
          >
            <div 
              className="video-card-thumb-area"
              style={{
                backgroundImage: `url(${home2Img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={whitePlayBtn} alt="Play Video" className="white-play-badge" />
            </div>
            <div className="video-card-caption">
              Conveyor Integration For<br></br>Advanced Quality Monitoring
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM SECTION: Start Inspection Card & Stats Counter
         ========================================================================= */}
      <div className="home-bottom-cards-grid">
        {/* Left Action Card: Start Inspection (Bold 40) */}
        <div className="start-inspection-card" onClick={onStartInspection}>
          <div className="inspection-thumb-wrapper">
            <img 
              src={home3Img} 
              alt="Fabric Under Inspection" 
              className="inspection-fabric-img"
              style={{
                width: '117.6px',
                height: '156.8px',
                border: '1px solid black',
                borderRadius: '12px',
                objectFit: 'cover'
              }}
            />
          </div>

          <div className="inspection-text-content">
            <div className="inspection-text-top">
              <h2 className="start-inspection-heading">Start Inspection</h2>
              <div className="last-inspection-link">
                Last Inspection: Colored Fabric
              </div>
            </div>
            <p className="inspection-sub-desc">
              Use AI to inspect garments for defects, stitching issues, fabric
              irregularities, stains, and finishing inconsistencies.
            </p>
          </div>

          <div className="inspection-arrow-action">
            <img src={arrowRight} alt="Start" className="arrow-right-svg-icon" />
          </div>
        </div>

        {/* Right Stats Card: Total Count, Accepted, Rejected */}
        <div className="home-stats-counter-card">
          <div className="stats-col">
            <div className="stats-col-label">Total Count</div>
            <div className="stats-col-value">
              {totalCount === 0 ? '0,000' : totalCount.toLocaleString().padStart(5, '0')}
            </div>
          </div>

          <div className="stats-col">
            <div className="stats-col-label">Accepted</div>
            <div className="stats-col-value">
              {acceptedCount === 0 ? '0,000' : acceptedCount.toLocaleString().padStart(5, '0')}
            </div>
          </div>

          <div className="stats-col">
            <div className="stats-col-label">Rejected</div>
            <div className="stats-col-value">
              {rejectedCount === 0 ? '0,000' : rejectedCount.toLocaleString().padStart(5, '0')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
