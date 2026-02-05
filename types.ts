export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle extends Rect {
  id: number;
  passed: boolean;
  type: 'static' | 'moving';
  initialY: number; // Used for sine wave movement
  speedOffset: number; // Randomize movement phase
}

export interface Player extends Rect {
  dy: number; // Vertical velocity
  rotation: number;
}

export interface LevelConfig {
  levelNumber: number;
  speed: number;
  obstacleGap: number; // Horizontal space between obstacles
  openingSize: number; // Vertical space to fly through
  hasMovingObstacles: boolean;
  color: string;
}