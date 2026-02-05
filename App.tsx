import React from 'react';
import GameEngine from './components/GameEngine';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <GameEngine />
      
      <div className="mt-8 text-slate-500 text-center max-w-2xl text-sm">
        <h3 className="font-bold text-slate-400 mb-2">How It Works (For Curious Minds)</h3>
        <p>
          The game runs a <strong>Game Loop</strong> roughly 60 times per second. In each frame, 
          we apply <strong>Gravity</strong> (adding to Y velocity) and check for <strong>Collisions</strong> 
          (overlapping rectangles). When you press Space, we apply negative velocity to "Jump".
        </p>
      </div>
    </div>
  );
}