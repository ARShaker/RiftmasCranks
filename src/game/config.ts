import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
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
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
};
