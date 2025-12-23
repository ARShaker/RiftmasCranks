import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1200,
    height: 600,
    backgroundColor: '#87CEEB', // Sky blue
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800, x: 0 },
        debug: false,
      },
    },
    scene: [GameScene],
    autoFocus: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
};
