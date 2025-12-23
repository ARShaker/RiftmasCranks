import React from 'react';

interface HUDProps {
  score: number;
  distance: number;
  multiplier: number;
}

export const HUD: React.FC<HUDProps> = ({ score, distance, multiplier }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '10px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '18px',
      minWidth: '200px',
      zIndex: 1000,
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Score:</strong> {score}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Distance:</strong> {distance}m
      </div>
      <div style={{
        color: multiplier > 1 ? '#FFD700' : 'white',
        fontWeight: multiplier > 1 ? 'bold' : 'normal',
      }}>
        <strong>Combo:</strong> x{multiplier.toFixed(1)}
      </div>
    </div>
  );
};
