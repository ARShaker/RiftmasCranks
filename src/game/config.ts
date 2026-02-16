import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

// Fixed internal resolution for consistent performance
// The game renders at this resolution and scales up to fill the screen
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.WEBGL,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#87CEEB', // Sky blue
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800, x: 0 },
        debug: false,
      },
    },
    input: {
      keyboard: {
        capture: [], // Don't capture any keys globally - let form inputs work
      },
    },
    scene: [GameScene],
    autoFocus: true,
    render: {
      pixelArt: false,
      antialias: true,
    },
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
};
