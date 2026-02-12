import React, { useState, useEffect } from 'react';
import { getLeaderboard, isHighScore, addScore, LeaderboardEntry } from '../utils/leaderboard';

interface GameOverProps {
  score: number;
  distance: number;
  landingAngle?: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

const pixelFont = '"Press Start 2P", "Courier New", monospace';

export const GameOver: React.FC<GameOverProps> = ({
  score,
  distance,
  landingAngle,
  onRestart,
  onBackToMenu,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [newEntryIndex, setNewEntryIndex] = useState<number | null>(null);

  useEffect(() => {
    const currentLeaderboard = getLeaderboard();
    setLeaderboard(currentLeaderboard);
    setIsNewHighScore(isHighScore(score));
  }, [score]);

  const handleSubmitScore = () => {
    if (playerName.trim()) {
      const updatedLeaderboard = addScore(playerName.trim(), score);
      setLeaderboard(updatedLeaderboard);
      setHasSubmitted(true);
      // Find the index of the newly added score
      const index = updatedLeaderboard.findIndex(
        (entry) => entry.score === score && entry.name === playerName.trim()
      );
      setNewEntryIndex(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitScore();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      pointerEvents: 'none',
      fontFamily: pixelFont,
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '32px',
        marginBottom: '20px',
        fontFamily: pixelFont,
      }}>
        Game Over!
      </h1>

      {/* Score Display */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '20px',
        minWidth: '300px',
        pointerEvents: 'auto',
      }}>
        {landingAngle !== undefined && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '10px',
            marginBottom: '15px',
            textAlign: 'center',
            fontFamily: pixelFont,
          }}>
            <strong>Landing Angle:</strong> {landingAngle.toFixed(1)}° (Max: 38°)
          </div>
        )}
        <div style={{
          color: 'white',
          fontSize: '14px',
          marginBottom: '10px',
          textAlign: 'center',
          fontFamily: pixelFont,
        }}>
          <strong>Final Score:</strong> {score}
        </div>
        <div style={{
          color: 'white',
          fontSize: '10px',
          textAlign: 'center',
          fontFamily: pixelFont,
        }}>
          <strong>Distance:</strong> {distance}m
        </div>
      </div>

      {/* High Score Entry */}
      {isNewHighScore && !hasSubmitted && (
        <div style={{
          backgroundColor: 'rgba(78, 205, 196, 0.2)',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '20px',
          textAlign: 'center',
          pointerEvents: 'auto',
          border: '2px solid #4ECDC4',
        }}>
          <div style={{
            color: '#4ECDC4',
            fontSize: '12px',
            marginBottom: '15px',
            fontWeight: 'bold',
            fontFamily: pixelFont,
          }}>
            New High Score!
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Name"
              maxLength={10}
              style={{
                padding: '10px 15px',
                fontSize: '12px',
                borderRadius: '8px',
                border: 'none',
                width: '120px',
                textAlign: 'center',
                fontFamily: pixelFont,
              }}
              autoFocus
            />
            <button
              onClick={handleSubmitScore}
              style={{
                padding: '10px 20px',
                fontSize: '10px',
                backgroundColor: '#4ECDC4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: pixelFont,
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
        minWidth: '350px',
        pointerEvents: 'auto',
      }}>
        <h2 style={{
          color: 'white',
          fontSize: '14px',
          marginBottom: '15px',
          textAlign: 'center',
          fontFamily: pixelFont,
        }}>
          Leaderboard
        </h2>
        {leaderboard.length === 0 ? (
          <div style={{
            color: '#aaa',
            textAlign: 'center',
            fontSize: '10px',
            fontFamily: pixelFont,
          }}>
            No scores yet. Be the first!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.score}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px',
                  backgroundColor: index === newEntryIndex
                    ? 'rgba(78, 205, 196, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: index === newEntryIndex ? '2px solid #4ECDC4' : 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}>
                  <span style={{
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#aaa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: '30px',
                    fontFamily: pixelFont,
                  }}>
                    {index + 1}.
                  </span>
                  <span style={{
                    color: 'white',
                    fontSize: '10px',
                    fontFamily: pixelFont,
                  }}>
                    {entry.name}
                  </span>
                </div>
                <span style={{
                  color: '#4ECDC4',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: pixelFont,
                }}>
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '20px',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={onRestart}
          style={{
            padding: '15px 30px',
            fontSize: '10px',
            backgroundColor: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            fontFamily: pixelFont,
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
            padding: '15px 30px',
            fontSize: '10px',
            backgroundColor: '#95E1D3',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            fontFamily: pixelFont,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7dd4c6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#95E1D3';
          }}
        >
          Menu
        </button>
      </div>
    </div>
  );
};
