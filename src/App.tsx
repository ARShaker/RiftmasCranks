import { useState } from 'react';
import { Character } from './types/character';
import { GameState } from './types/game';
import { CharacterSelection } from './components/CharacterSelection';
import { GameContainer } from './components/GameContainer';
import { GameOver } from './components/GameOver';

function App() {
  const [gameState, setGameState] = useState<GameState>('character-select');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setGameState('playing');
  };

  const handleGameOver = (score: number, distance: number) => {
    setFinalScore(score);
    setFinalDistance(distance);
    setGameState('game-over');
  };

  const handleRestart = () => {
    if (selectedCharacter) {
      setGameState('playing');
    }
  };

  const handleBackToMenu = () => {
    setSelectedCharacter(null);
    setGameState('character-select');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {gameState === 'character-select' && (
        <CharacterSelection onSelect={handleCharacterSelect} />
      )}

      {gameState === 'playing' && selectedCharacter && (
        <GameContainer
          key={`game-${Date.now()}`} // Force remount on restart
          character={selectedCharacter}
          onGameOver={handleGameOver}
        />
      )}

      {gameState === 'game-over' && (
        <GameOver
          score={finalScore}
          distance={finalDistance}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;
