import { LevelConfig } from './types';

// Physics
export const GRAVITY = 0.4;
export const JUMP_STRENGTH = -7.5;
export const TERMINAL_VELOCITY = 8;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Game Balance
export const DISTANCE_TO_NEXT_LEVEL = 10; // Obstacles passed to advance
export const MAX_LEVEL = 12;

// Audio Placeholder (Free generic upbeat loop)
export const BG_MUSIC_URL = "https://opengameart.org/sites/default/files/Rolemusic_-_PL_-_04_-_Anti_Vortex_0.mp3"; 
// ^ REPLACE THIS STRING with your local .ogg file path (e.g., "/music/space_cat.ogg")

// Level Configurations
export const LEVELS: Record<number, LevelConfig> = {
  // Levels 1-4: Static, Slow, Easy
  1: { levelNumber: 1, speed: 3, obstacleGap: 300, openingSize: 220, hasMovingObstacles: false, color: '#4ade80' },
  2: { levelNumber: 2, speed: 3.5, obstacleGap: 280, openingSize: 210, hasMovingObstacles: false, color: '#4ade80' },
  3: { levelNumber: 3, speed: 4, obstacleGap: 260, openingSize: 200, hasMovingObstacles: false, color: '#22c55e' },
  4: { levelNumber: 4, speed: 4.5, obstacleGap: 250, openingSize: 190, hasMovingObstacles: false, color: '#22c55e' },

  // Levels 5-8: Moving obstacles, Medium Speed
  5: { levelNumber: 5, speed: 5, obstacleGap: 240, openingSize: 180, hasMovingObstacles: true, color: '#facc15' },
  6: { levelNumber: 6, speed: 5.5, obstacleGap: 230, openingSize: 170, hasMovingObstacles: true, color: '#eab308' },
  7: { levelNumber: 7, speed: 6, obstacleGap: 220, openingSize: 160, hasMovingObstacles: true, color: '#ca8a04' },
  8: { levelNumber: 8, speed: 6.5, obstacleGap: 210, openingSize: 155, hasMovingObstacles: true, color: '#d97706' },

  // Levels 9-12: Fast, Tight, Hard
  9: { levelNumber: 9, speed: 7, obstacleGap: 200, openingSize: 150, hasMovingObstacles: true, color: '#f87171' },
  10: { levelNumber: 10, speed: 7.5, obstacleGap: 190, openingSize: 145, hasMovingObstacles: true, color: '#ef4444' },
  11: { levelNumber: 11, speed: 8, obstacleGap: 180, openingSize: 140, hasMovingObstacles: true, color: '#dc2626' },
  12: { levelNumber: 12, speed: 9, obstacleGap: 170, openingSize: 130, hasMovingObstacles: true, color: '#991b1b' },
};