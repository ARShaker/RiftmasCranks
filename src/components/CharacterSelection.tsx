import React from 'react';
import { Character } from '../types/character';
import { characters } from '../data/characters';

interface CharacterSelectionProps {
  onSelect: (character: Character) => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onSelect }) => {
  // Split characters into two rows: 4 and 5
  const firstRow = characters.slice(0, 4);
  const secondRow = characters.slice(4, 9);

  const renderCharacterCard = (character: Character) => (
    <div
      key={character.id}
      onClick={() => onSelect(character)}
      style={{
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '15px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: `3px solid ${character.color}`,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '150px',
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
          width: '126px',
          height: '126px',
          margin: '0 auto 15px',
          borderRadius: '50%',
          padding: '3px',
          backgroundColor: character.color,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          {character.icon ? (
            <img
              src={character.icon}
              alt={character.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: character.color,
              }}
            />
          )}
        </div>
      </div>
      <h3 style={{
        color: 'white',
        fontSize: '20px',
        marginBottom: '10px',
      }}>
        {character.name}
      </h3>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'auto',
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '48px',
        marginBottom: '10px',
        fontFamily: 'Arial, sans-serif',
      }}>
        The Riftmas Cranks
      </h1>
      <h2 style={{
        color: '#aaa',
        fontSize: '24px',
        marginBottom: '30px',
      }}>
        Choose Your Cranker
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '95vw',
        width: '100%',
        alignItems: 'center',
      }}>
        {/* First row - 4 characters */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {firstRow.map(renderCharacterCard)}
        </div>

        {/* Second row - 5 characters */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {secondRow.map(renderCharacterCard)}
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        color: '#aaa',
        fontSize: '14px',
        textAlign: 'center',
        maxWidth: '600px',
      }}>
        <p><strong>Controls:</strong></p>
        <p>SPACEBAR - Jump | SHIFT - Speed Boost</p>
        <p>W/UP - Flip | A/LEFT or D/RIGHT - Roll | S/DOWN - Fall Faster</p>
        <p>Land 10 flips to unlock CRANK!</p>
      </div>
    </div>
  );
};
