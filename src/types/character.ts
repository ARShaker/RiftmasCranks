export interface Character {
  id: string;
  name: string;
  height: number; // 0.8 - 1.2 (multiplier, 1.0 is average)
  weight: number; // 0.8 - 1.2 (multiplier, 1.0 is average)
  color: string; // Character color for rendering
  avatar?: string; // Optional avatar image path
  icon?: string; // Optional icon image path for character selection
}

export interface CharacterPhysics {
  jumpPower: number;
  fallSpeed: number;
  groundSpeed: number;
  airSpeed: number;
  trickDifficulty: number; // Higher = harder to complete tricks
}
