import { useState, useCallback } from 'react';
import { Character } from './types/character';
import { GameState } from './types/game';
import { StartScreen } from './components/StartScreen';
import { CharacterSelection } from './components/CharacterSelection';
import { GameContainer } from './components/GameContainer';
import { GameOver } from './components/GameOver';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const [landingAngle, setLandingAngle] = useState<number | undefined>(undefined);
  const [gameKey, setGameKey] = useState(0); // Key that only changes on actual restart

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setGameState('playing');
    setGameKey(Date.now()); // New game instance
  };

  const handleGameOver = useCallback((score: number, distance: number, angle?: number) => {
    setFinalScore(score);
    setFinalDistance(distance);
    setLandingAngle(angle);
    setGameState('game-over');
  }, []);

  const handleRestart = () => {
    if (selectedCharacter) {
      setGameState('playing');
      setGameKey(Date.now()); // Force remount to restart game
    }
  };

  const handleStartGame = () => {
    setGameState('character-select');
  };

  const handleBackToMenu = () => {
    setSelectedCharacter(null);
    setGameState('menu');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {gameState === 'menu' && (
        <StartScreen onStart={handleStartGame} />
      )}

      {gameState === 'character-select' && (
        <CharacterSelection onSelect={handleCharacterSelect} />
      )}

      {(gameState === 'playing' || gameState === 'game-over') && selectedCharacter && (
        <>
          <GameContainer
            key={gameKey} // Only changes when we actually restart
            character={selectedCharacter}
            onGameOver={handleGameOver}
          />
          {gameState === 'game-over' && (
            <GameOver
              score={finalScore}
              distance={finalDistance}
              landingAngle={landingAngle}
              onRestart={handleRestart}
              onBackToMenu={handleBackToMenu}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
