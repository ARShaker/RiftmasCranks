import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Character } from '../types/character';
import { createGameConfig } from '../game/config';
import { HUD } from './HUD';

interface GameContainerProps {
  character: Character;
  onGameOver: (score: number, distance: number, landingAngle?: number) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({ character, onGameOver }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [currentTrickPoints, setCurrentTrickPoints] = useState(0);
  const [currentTrickName, setCurrentTrickName] = useState('');

  // Keep the ref up to date without triggering effect re-runs
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Create game configuration
    const config = createGameConfig('game-container');

    // Create game instance
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Restart the scene with character data after game is ready
    setTimeout(() => {
      const sceneKey = 'GameScene';

      // Always restart - this will work whether scene is active or not
      try {
        game.scene.stop(sceneKey);
      } catch (e) {
        // Scene may not be running yet
      }

      game.scene.start(sceneKey, {
        character,
        onScoreUpdate: (newScore: number, newDistance: number, newMultiplier: number) => {
          setScore(newScore);
          setDistance(newDistance);
          setMultiplier(newMultiplier);
        },
        onTrickUpdate: (points: number, trickName: string) => {
          setCurrentTrickPoints(points);
          setCurrentTrickName(trickName);
        },
        onGameOver: (finalScore: number, finalDistance: number, landingAngle?: number) => {
          onGameOverRef.current(finalScore, finalDistance, landingAngle);
        },
      });

      // Focus the canvas so keyboard input works
      setTimeout(() => {
        const canvas = game.canvas;
        if (canvas) {
          canvas.focus();
        }
      }, 300);
    }, 200);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [character]); // Only re-run when character changes, not onGameOver

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        id="game-container"
        ref={gameContainerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
      <HUD
        score={score}
        distance={distance}
        multiplier={multiplier}
        currentTrickPoints={currentTrickPoints}
        currentTrickName={currentTrickName}
      />
    </div>
  );
};
