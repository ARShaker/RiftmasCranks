export type GameState = 'menu' | 'character-select' | 'playing' | 'game-over';

export interface GameScore {
  points: number;
  distance: number;
  tricksCompleted: number;
  comboMultiplier: number;
}

export interface Trick {
  name: string;
  keys: string[]; // Combination of WASD keys
  points: number;
  rotationRequired: number; // Degrees of rotation needed
  completed: boolean;
}

export interface TerrainSegment {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObstacleData {
  x: number;
  y: number;
  type: 'rock' | 'ramp' | 'gap';
  width: number;
  height: number;
}
