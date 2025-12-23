import { Character } from '../types/character';

export const characters: Character[] = [
  {
    id: 'friend1',
    name: 'Alex',
    height: 1.15, // Taller - harder tricks, more air
    weight: 0.9,  // Lighter - slower falling, less momentum
    color: '#FF6B6B',
  },
  {
    id: 'friend2',
    name: 'Jordan',
    height: 0.85, // Shorter - easier tricks, less air
    weight: 1.2,  // Heavier - faster falling, more momentum
    color: '#4ECDC4',
  },
  {
    id: 'friend3',
    name: 'Sam',
    height: 1.0,  // Average
    weight: 1.0,  // Average - balanced character
    color: '#95E1D3',
  },
  {
    id: 'friend4',
    name: 'Taylor',
    height: 1.1,  // Tall
    weight: 1.15, // Heavy - goes fast and far
    color: '#F38181',
  },
  {
    id: 'friend5',
    name: 'Casey',
    height: 0.9,  // Short
    weight: 0.85, // Light - floaty gameplay
    color: '#AA96DA',
  },
];
