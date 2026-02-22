import React from 'react';

interface RulesPageProps {
  onBack: () => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({ onBack }) => {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '25px',
    textAlign: 'left',
  };

  const headerStyle: React.CSSProperties = {
    color: '#FFD700',
    fontSize: '14px',
    marginBottom: '10px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
  };

  const textStyle: React.CSSProperties = {
    color: '#ccc',
    fontSize: '10px',
    lineHeight: '2',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      padding: '40px 20px',
      boxSizing: 'border-box',
      overflowY: 'auto',
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '20px',
        marginBottom: '30px',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }}>
        Game Rules
      </h1>

      <div style={{
        maxWidth: '700px',
        width: '100%',
      }}>
        {/* Trails Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>Trail Difficulty</h2>
          <div style={textStyle}>
            <p>The trail changes based on distance traveled:</p>
            <p style={{ color: '#00FF00' }}>Green Trail: 0 - 1000m (1.0x speed)</p>
            <p style={{ color: '#0088FF' }}>Blue Trail: 1000 - 2000m (1.4x speed)</p>
            <p style={{ color: '#888' }}>Black Diamond: 2000m+ (1.8x speed)</p>
          </div>
        </div>

        {/* Landing Angle Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>Landing</h2>
          <div style={textStyle}>
            <p>You must land within 45 degrees of the terrain slope.</p>
            <p>Landing at a steeper angle will cause a crash!</p>
            <p>The game calculates your angle relative to the slope, not absolute rotation.</p>
          </div>
        </div>

        {/* Combo Meter Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>Combo Meter</h2>
          <div style={textStyle}>
            <p>Land flips to increase your score multiplier (up to 5x).</p>
            <p>Each flip landed adds +1 to your multiplier.</p>
            <p>The combo meter drains over 10 seconds.</p>
            <p>When the meter empties, multiplier drops by 1.</p>
            <p>Land more flips to keep your combo alive!</p>
          </div>
        </div>

        {/* Crank Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>CRANK!</h2>
          <div style={textStyle}>
            <p>Land 10 total flips to unlock CRANK ability.</p>
            <p>When unlocked, "TIME TO CRANK" appears.</p>
            <p>Press SPACEBAR while airborne to activate!</p>
            <p>CRANK grants +1000 points and clears all obstacles.</p>
            <p>After using CRANK, your flip counter resets to 0.</p>
            <p>You can earn CRANK multiple times per run!</p>
          </div>
        </div>

        {/* Scoring Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>Scoring</h2>
          <div style={textStyle}>
            <p>Points are awarded over time (10 pts/sec x multiplier).</p>
            <p>Flip tricks:</p>
            <p>&nbsp;&nbsp;Single Flip = 1x multiplier increase</p>
            <p>&nbsp;&nbsp;Double Flip = 2x multiplier increase</p>
            <p>&nbsp;&nbsp;Triple+ = even more!</p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={sectionStyle}>
          <h2 style={headerStyle}>Controls</h2>
          <div style={textStyle}>
            <p>SPACEBAR - Jump / Activate CRANK</p>
            <p>SHIFT - Speed Boost</p>
            <p>A / LEFT ARROW - Roll Left</p>
            <p>D / RIGHT ARROW - Roll Right</p>
            <p>S / DOWN ARROW - Fall Faster</p>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        style={{
          marginTop: '30px',
          marginBottom: '30px',
          padding: '15px 40px',
          fontSize: '12px',
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          backgroundColor: '#16213e',
          color: 'white',
          border: '3px solid #FFD700',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 20px #FFD700';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Back
      </button>
    </div>
  );
};
