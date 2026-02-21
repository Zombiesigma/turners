'use client';

import { useState, useCallback, useRef } from 'react';
import { GameCanvas } from '@/components/game-canvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { VirtualJoystick } from '@/components/virtual-joystick';

export default function GamePage() {
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [gameKey, setGameKey] = useState(Date.now());
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, z: 0 });
  const totalCollectibles = 40;
  const lavaAudioRef = useRef<HTMLAudioElement>(null);
  const collectAudioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();

  const handleRestart = () => {
    setScore(0);
    setGameStatus('playing');
    setGameKey(Date.now());
    if (lavaAudioRef.current) {
      lavaAudioRef.current.pause();
    }
  };

  const handleGameWon = useCallback(() => {
    setGameStatus('won');
    if (lavaAudioRef.current) {
      lavaAudioRef.current.pause();
    }
  }, []);
  
  const handleCollectSound = useCallback(() => {
    if (collectAudioRef.current) {
      collectAudioRef.current.currentTime = 0;
      collectAudioRef.current.play().catch(e => {});
    }
  }, []);

  const handleJoystickMove = useCallback((delta: { x: number; z: number }) => {
    setJoystickDelta(delta);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-center backdrop-blur-sm landscape:hidden md:hidden">
        <Smartphone className="h-24 w-24 animate-pulse text-white" />
        <h2 className="mt-6 text-3xl font-bold text-white">Please Rotate Your Device</h2>
        <p className="mt-2 text-lg text-white/80">This game is designed for a landscape experience.</p>
      </div>

      <audio autoPlay loop>
        <source src="https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/freesound_community-horror01_loop-29220.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={lavaAudioRef} loop>
        <source src="https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/u_5iteaickfa-lava-steam-with-bubbles-312339.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={collectAudioRef}>
        <source src="https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/floraphonic-arcade-ui-6-229503.mp3" type="audio/mpeg" />
      </audio>
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
      
      <GameCanvas
        key={gameKey}
        setScore={setScore}
        setGameWon={handleGameWon}
        collectibleCount={totalCollectibles}
        lavaAudioRef={lavaAudioRef}
        onCollect={handleCollectSound}
        joystickDelta={joystickDelta}
      />

      {isMobile && <VirtualJoystick onMove={handleJoystickMove} />}

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
