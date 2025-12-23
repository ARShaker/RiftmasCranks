# Hill Climb Racing - Riftmas Cranks

A browser-based hill climb racing game built with React, TypeScript, and Phaser 3.

## Features

- **Character Selection**: Choose from 5 different characters, each with unique height and weight properties
- **Physics-Based Gameplay**: Character stats affect gameplay:
  - **Heavier characters**: Fall faster, gain more momentum, achieve higher speeds
  - **Taller characters**: Get more air off jumps, but harder to complete tricks
  - **Lighter characters**: Float longer in the air, slower speeds
  - **Shorter characters**: Easier to land tricks, less air time

- **Controls**:
  - `SPACEBAR` - Jump (tap), Crouch (hold on ground), Increase gravity/fall faster (hold in air)
  - `W` - Front flip
  - `A` - Roll left
  - `S` - Back flip
  - `D` - Roll right

- **Scoring System**:
  - Complete tricks in the air for points
  - Build combo multipliers (up to 5x)
  - Track your distance traveled
  - Combo resets when you land

- **Procedural Generation**: Infinite terrain with varied hills and obstacles

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Customizing Characters

Edit the character data in `src/data/characters.ts`:

```typescript
{
  id: 'friend1',
  name: 'Your Friend Name',
  height: 1.15, // 0.8 - 1.2 (1.0 is average)
  weight: 0.9,  // 0.8 - 1.2 (1.0 is average)
  color: '#FF6B6B', // Hex color for character
}
```

## Game Architecture

- **React Components** (`src/components/`):
  - `CharacterSelection.tsx` - Character selection menu
  - `GameContainer.tsx` - Phaser game integration
  - `HUD.tsx` - Score display overlay
  - `GameOver.tsx` - End game screen

- **Phaser Game** (`src/game/`):
  - `scenes/GameScene.ts` - Main gameplay scene
  - `classes/Player.ts` - Player character with physics
  - `classes/Terrain.ts` - Procedural terrain generation
  - `classes/Obstacle.ts` - Dynamic obstacle spawning

- **Types** (`src/types/`):
  - TypeScript interfaces for type safety

## Tips for Playing

1. **Character Selection Matters**:
   - Balanced characters (Sam) are great for beginners
   - Heavy characters go fast but are harder to control in the air
   - Light characters are floaty and great for tricks

2. **Trick Combos**:
   - Complete full rotations (360°) for points
   - Use gravity boost (hold space in air) to land faster and start building speed again
   - Combo multiplier increases with each trick

3. **Terrain Navigation**:
   - Use ramps to get big air for tricks
   - Crouch on landing to prepare for the next jump
   - Watch out for gaps and obstacles

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Phaser 3** - Game engine with Arcade physics
- **Vite** - Fast build tool and dev server

Enjoy the game!
