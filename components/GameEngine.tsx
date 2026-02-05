import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Player, Obstacle } from '../types';
import { GRAVITY, JUMP_STRENGTH, LEVELS, CANVAS_HEIGHT, CANVAS_WIDTH, DISTANCE_TO_NEXT_LEVEL, MAX_LEVEL, BG_MUSIC_URL } from '../constants';
import { Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for mutable game data (avoids re-renders during 60fps loop)
  const playerRef = useRef<Player>({ x: 100, y: 300, width: 40, height: 30, dy: 0, rotation: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const frameRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const levelProgressRef = useRef<number>(0);
  
  // Initialize or Reset Game
  const resetGame = useCallback(() => {
    playerRef.current = { x: 100, y: CANVAS_HEIGHT / 2, width: 40, height: 30, dy: 0, rotation: 0 };
    obstaclesRef.current = [];
    distanceRef.current = 0;
    levelProgressRef.current = 0;
    setLevel(1);
    setScore(0);
    setGameState(GameState.PLAYING);
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio autoplay prevented", e));
    }
  }, [isMuted]);

  // Jump Action
  const jump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      playerRef.current.dy = JUMP_STRENGTH;
      playerRef.current.rotation = -25;
    } else if (gameState === GameState.START || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
      resetGame();
    }
  }, [gameState, resetGame]);

  // Audio Toggle
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      if (!isMuted) audioRef.current.pause();
      else if (gameState === GameState.PLAYING) audioRef.current.play();
    }
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (gameState !== GameState.PLAYING) {
        // Just render static background or last frame when not playing
        if (gameState === GameState.START) renderStartScreen(ctx);
        return; 
      }

      const config = LEVELS[level] || LEVELS[MAX_LEVEL];

      // --- 1. UPDATE PHYSICS ---

      // Player Gravity
      const player = playerRef.current;
      player.dy += GRAVITY;
      player.y += player.dy;
      
      // Rotate Cat based on velocity (Visual flair)
      if (player.dy < 0) player.rotation = Math.max(-25, player.rotation - 2);
      else player.rotation = Math.min(25, player.rotation + 2);

      // Floor/Ceiling Collision
      if (player.y + player.height >= CANVAS_HEIGHT || player.y <= 0) {
        handleGameOver();
        return;
      }

      // Obstacle Spawning
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || (CANVAS_WIDTH - lastObs.x >= config.obstacleGap)) {
        spawnObstacle(config.openingSize, config.hasMovingObstacles);
      }

      // Obstacle Movement & Collision
      obstaclesRef.current.forEach(obs => {
        obs.x -= config.speed;

        // Moving obstacle logic (Levels 5+)
        if (obs.type === 'moving') {
          // Sine wave movement
          const movementRange = 50; 
          obs.y = obs.initialY + Math.sin(Date.now() / 300 + obs.speedOffset) * movementRange;
        }

        // Collision Detection (AABB)
        if (
          player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          handleGameOver();
        }

        // Scoring
        if (!obs.passed && player.x > obs.x + obs.width) {
          obs.passed = true;
          // Only count score for the top pipe to avoid double counting
          if (obs.y < 0) { // It's a top pipe logic essentially
             // Actually, since we spawn pairs, let's just increment on passing the pair X
          }
        }
      });

      // Simple score increment based on distance for smoother feel
      distanceRef.current++;
      if (distanceRef.current % 50 === 0) setScore(s => s + 1);

      // Level Progression
      // Check if we passed a pair of obstacles (top/bottom)
      const passedObstacles = obstaclesRef.current.filter(o => o.passed && o.x + o.width < 0);
      // We clean up off-screen obstacles
      if (obstaclesRef.current.length > 0 && obstaclesRef.current[0].x < -100) {
        obstaclesRef.current.shift(); // Remove top
        if(obstaclesRef.current[0]) obstaclesRef.current.shift(); // Remove bottom
        
        levelProgressRef.current++;
        if (levelProgressRef.current >= DISTANCE_TO_NEXT_LEVEL) {
          if (level < MAX_LEVEL) {
            setLevel(l => l + 1);
            levelProgressRef.current = 0;
          } else {
             // Victory condition at end of level 12
             setGameState(GameState.VICTORY);
          }
        }
      }

      // --- 2. RENDER ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw Background (Starfield effect)
      drawBackground(ctx, level);

      // Draw Obstacles
      ctx.fillStyle = config.color;
      obstaclesRef.current.forEach(obs => {
        // IMAGE REPLACEMENT: 
        // ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.shadowBlur = 0;
        
        // Add some "tech" details to the rects
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
        ctx.fillStyle = config.color;
      });

      // Draw Player
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      ctx.rotate((player.rotation * Math.PI) / 180);
      
      // IMAGE REPLACEMENT:
      // ctx.drawImage(catImage, -player.width/2, -player.height/2, player.width, player.height);
      
      // Drawing the Cat (Geometric placeholder)
      ctx.fillStyle = '#ffffff'; // White Cat
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
      // Cat Ears
      ctx.beginPath();
      ctx.moveTo(-player.width/2, -player.height/2);
      ctx.lineTo(-player.width/2 + 10, -player.height/2 - 10);
      ctx.lineTo(-player.width/2 + 20, -player.height/2);
      ctx.fill();
      // Cat Eye (visor)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, -5, 15, 10);
      // Jetpack flame
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-player.width/2, 0);
      ctx.lineTo(-player.width/2 - 15, 5);
      ctx.lineTo(-player.width/2, 10);
      ctx.fill();

      ctx.restore();

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, level]);

  // Helpers
  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
    setHighScore(prev => Math.max(prev, score));
    if (audioRef.current) audioRef.current.pause();
  };

  const spawnObstacle = (openingSize: number, moving: boolean) => {
    const minHeight = 50;
    const maxTopHeight = CANVAS_HEIGHT - openingSize - minHeight;
    const topHeight = Math.floor(Math.random() * (maxTopHeight - minHeight + 1)) + minHeight;

    const obsType = moving ? 'moving' : 'static';
    const speedOffset = Math.random() * 100;

    // Top Obstacle
    obstaclesRef.current.push({
      id: Date.now(),
      x: CANVAS_WIDTH,
      y: 0, // Starts at top
      width: 60,
      height: topHeight,
      passed: false,
      type: obsType,
      initialY: 0, // Only matters if we move the pipe entirely, usually we just stretch, but for simplicity we keep static structure and move Y if needed
      speedOffset
    });

    // Bottom Obstacle
    obstaclesRef.current.push({
      id: Date.now() + 1,
      x: CANVAS_WIDTH,
      y: topHeight + openingSize,
      width: 60,
      height: CANVAS_HEIGHT - (topHeight + openingSize),
      passed: false,
      type: obsType,
      initialY: topHeight + openingSize,
      speedOffset
    });
  };

  const renderStartScreen = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx, 1);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, currentLevel: number) => {
     // Space Gradient
     const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
     gradient.addColorStop(0, '#0f172a'); // Slate 900
     gradient.addColorStop(1, '#1e1b4b'); // Indigo 950
     ctx.fillStyle = gradient;
     ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

     // Simple Stars
     ctx.fillStyle = '#ffffff';
     const seed = Math.floor(Date.now() / 1000); // Twinkle slowly
     for(let i=0; i<50; i++) {
        const x = (i * 137 + distanceRef.current * 0.5) % CANVAS_WIDTH;
        const y = (i * 293) % CANVAS_HEIGHT;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x, y, size, size);
     }
     ctx.globalAlpha = 1.0;
  };
  
  // Handling Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump();
    };
    const handleTouch = (e: TouchEvent) => {
        e.preventDefault(); // Stop scrolling
        jump();
    }
    
    window.addEventListener('keydown', handleKeyDown);
    // Bind to canvas for touch to prevent whole-page scrolling issues
    const canvas = canvasRef.current;
    canvas?.addEventListener('touchstart', handleTouch, {passive: false});

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas?.removeEventListener('touchstart', handleTouch);
    };
  }, [jump]);

  return (
    <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black">
      
      {/* Audio Element */}
      <audio ref={audioRef} loop src={BG_MUSIC_URL} />

      {/* Main Canvas */}
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="w-full h-full object-contain block"
      />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="bg-slate-800/80 text-white px-4 py-2 rounded-lg border border-slate-600 font-bold pixel-font shadow-lg">
            SCORE: {score}
          </div>
          <div className="bg-slate-800/80 text-yellow-400 px-4 py-2 rounded-lg border border-slate-600 font-bold pixel-font text-sm shadow-lg">
            LEVEL: {level} / {MAX_LEVEL}
          </div>
        </div>
        
        <button 
          onClick={toggleAudio} 
          className="pointer-events-auto bg-slate-800/80 p-2 rounded-full hover:bg-slate-700 text-white border border-slate-600 transition-colors"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Start Screen Overlay */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6 pixel-font text-center leading-relaxed drop-shadow-[0_4px_0_rgba(255,255,255,0.2)]">
            GALACTIX CAT
          </h1>
          <p className="mb-8 text-slate-300 text-lg max-w-md text-center">
            Help the cat fly through the nebula! <br/>
            Dodge the pipes. Survive 12 Levels.
          </p>
          <div className="animate-bounce">
             <PlayButton onClick={resetGame} label="START MISSION" />
          </div>
          <p className="mt-8 text-sm text-slate-400 font-mono">Press SPACE or TAP to fly</p>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <h2 className="text-5xl font-bold mb-2 pixel-font text-red-500 drop-shadow-lg">CRASHED!</h2>
          <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-700 text-center mb-8 shadow-xl">
             <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Final Score</p>
             <p className="text-4xl font-bold mb-4">{score}</p>
             <p className="text-slate-500 text-xs">High Score: {highScore}</p>
          </div>
          <PlayButton onClick={resetGame} label="TRY AGAIN" icon={<RotateCcw className="mr-2" />} />
        </div>
      )}

      {/* Victory Overlay */}
      {gameState === GameState.VICTORY && (
        <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Trophy size={64} className="text-yellow-400 mb-4 animate-pulse" />
          <h2 className="text-4xl font-bold mb-6 pixel-font text-yellow-300 text-center">MISSION COMPLETE!</h2>
          <p className="text-xl mb-8 text-center max-w-md">You have conquered the galaxy, brave feline.</p>
          <PlayButton onClick={resetGame} label="PLAY AGAIN" icon={<RotateCcw className="mr-2" />} />
        </div>
      )}

      {/* Mobile Controls Hint */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-4 w-full text-center pointer-events-none opacity-50">
          <span className="text-white text-xs bg-black/20 px-3 py-1 rounded-full">Tap anywhere to fly</span>
        </div>
      )}
    </div>
  );
};

const PlayButton = ({ onClick, label, icon }: { onClick: () => void, label: string, icon?: React.ReactNode }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 font-lg rounded-full hover:bg-blue-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
  >
    {icon}
    {label}
  </button>
);

export default GameEngine;