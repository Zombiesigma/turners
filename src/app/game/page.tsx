'use client';

import { useState } from 'react';
import { GameCanvas } from '@/components/game-canvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw } from 'lucide-react';
import Link from 'next/link';

export default function GamePage() {
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [gameKey, setGameKey] = useState(Date.now());
  const totalCollectibles = 10;

  const handleRestart = () => {
    setScore(0);
    setGameStatus('playing');
    setGameKey(Date.now());
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Link>
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg font-mono text-lg">
          Score: {score} / {totalCollectibles}
        </div>
        <Button variant="outline" size="icon" onClick={handleRestart}>
          <RotateCw className="h-4 w-4" />
          <span className="sr-only">Restart Game</span>
        </Button>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
        <h1 className="text-4xl font-bold font-headline gradient-text">3D Cube Runner</h1>
        <p className="text-muted-foreground mt-2">Use arrow keys to move. Collect all the spinning rings.</p>
      </div>
      
      <GameCanvas
        key={gameKey}
        setScore={setScore}
        setGameWon={() => setGameStatus('won')}
        collectibleCount={totalCollectibles}
      />

      {gameStatus === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <h2 className="text-6xl font-bold font-headline gradient-text">You Win!</h2>
          <p className="text-xl text-white mt-2">Final Score: {score}</p>
          <Button onClick={handleRestart} className="mt-8" size="lg">
            <RotateCw className="mr-2 h-5 w-5" />
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
}
