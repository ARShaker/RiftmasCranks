import React from 'react';
import { Character } from '../types/character';
import { characters } from '../data/characters';

interface CharacterSelectionProps {
  onSelect: (character: Character) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onSelect }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      padding: '20px',
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '48px',
        marginBottom: '20px',
        fontFamily: 'Arial, sans-serif',
      }}>
        Hill Climb Racing
      </h1>
      <h2 style={{
        color: '#aaa',
        fontSize: '24px',
        marginBottom: '40px',
      }}>
        Select Your Character
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        width: '100%',
      }}>
        {characters.map((character) => (
          <div
            key={character.id}
            onClick={() => onSelect(character)}
            style={{
              backgroundColor: '#16213e',
              padding: '30px',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `3px solid ${character.color}`,
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 20px ${character.color}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '80px',
                height: '120px',
                backgroundColor: character.color,
                margin: '0 auto 20px',
                borderRadius: '10px',
                transform: `scaleY(${character.height}) scaleX(${character.weight})`,
              }}
            />
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              marginBottom: '15px',
            }}>
              {character.name}
            </h3>
            <div style={{
              color: '#aaa',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              <div>Height: {(character.height * 100).toFixed(0)}%</div>
              <div>Weight: {(character.weight * 100).toFixed(0)}%</div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                {character.height > 1.05 && character.weight > 1.05 && 'Big & Heavy - Fast & Powerful'}
                {character.height > 1.05 && character.weight < 0.95 && 'Tall & Light - High Jumps'}
                {character.height < 0.95 && character.weight > 1.05 && 'Short & Heavy - Stable & Fast'}
                {character.height < 0.95 && character.weight < 0.95 && 'Small & Light - Floaty & Agile'}
                {character.height >= 0.95 && character.height <= 1.05 && character.weight >= 0.95 && character.weight <= 1.05 && 'Balanced - All-rounder'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: '40px',
        color: '#aaa',
        fontSize: '16px',
        textAlign: 'center',
        maxWidth: '600px',
      }}>
        <p><strong>Controls:</strong></p>
        <p>SPACEBAR - Jump (tap) | Crouch (hold on ground) | Fall faster (hold in air)</p>
        <p>WASD - Perform tricks in the air</p>
      </div>
    </div>
  );
};
