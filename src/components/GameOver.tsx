import React from 'react';

interface GameOverProps {
  score: number;
  distance: number;
  landingAngle?: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  distance,
  landingAngle,
  onRestart,
  onBackToMenu,
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      pointerEvents: 'none',
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '64px',
        marginBottom: '40px',
      }}>
        Game Over!
      </h1>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '15px',
        marginBottom: '40px',
        minWidth: '300px',
        pointerEvents: 'auto',
      }}>
        {landingAngle !== undefined && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '28px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <strong>Landing Angle:</strong> {landingAngle.toFixed(1)}° (Max: 30°)
          </div>
        )}
        <div style={{
          color: 'white',
          fontSize: '24px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <strong>Final Score:</strong> {score}
        </div>
        <div style={{
          color: 'white',
          fontSize: '24px',
          textAlign: 'center',
        }}>
          <strong>Distance:</strong> {distance}m
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '20px',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={onRestart}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            backgroundColor: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45b8b0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4ECDC4';
          }}
        >
          Restart
        </button>
        <button
          onClick={onBackToMenu}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            backgroundColor: '#95E1D3',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7dd4c6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#95E1D3';
          }}
        >
          Character Select
        </button>
      </div>
    </div>
  );
};
