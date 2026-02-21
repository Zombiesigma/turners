'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { GameCanvas } from '@/components/game-canvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw, Smartphone, Sword } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { VirtualJoystick } from '@/components/virtual-joystick';
import { cn } from '@/lib/utils';

const HealthBar = ({ health, maxHealth }: { health: number, maxHealth: number }) => {
  const healthPercentage = Math.max(0, (health / maxHealth) * 100);
  return (
    <div className="h-2 w-16 rounded-full bg-red-800 border border-black/50">
      <div
        className="h-full rounded-full bg-green-500 transition-all duration-300"
        style={{ width: `${healthPercentage}%` }}
      />
    </div>
  );
};


export default function GamePage() {
  const totalCollectibles = 40;
  const initialPlayerHealth = 100;
  const initialEnemies = useMemo(() => [
    { id: 'enemy1', health: 100, maxHealth: 100, position: new THREE.Vector3(-20, 0.8, -20) },
    { id: 'enemy2', health: 100, maxHealth: 100, position: new THREE.Vector3(20, 0.8, 20) },
  ], []);

  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [gameKey, setGameKey] = useState(Date.now());
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, z: 0 });
  const [isAttacking, setIsAttacking] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(initialPlayerHealth);
  const [enemies, setEnemies] = useState(initialEnemies);

  const lavaAudioRef = useRef<HTMLAudioElement>(null);
  const collectAudioRef = useRef<HTMLAudioElement>(null);
  const playerHealthBarRef = useRef<HTMLDivElement>(null);
  const enemyHealthBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const isMobile = useIsMobile();

  const handleRestart = () => {
    setScore(0);
    setGameStatus('playing');
    setPlayerHealth(initialPlayerHealth);
    setEnemies(initialEnemies.map(e => ({ ...e, health: e.maxHealth })));
    setGameKey(Date.now());
    if (lavaAudioRef.current) {
      lavaAudioRef.current.pause();
    }
  };

  const handleGameWon = useCallback(() => {
    if (gameStatus === 'playing') {
      setGameStatus('won');
      if (lavaAudioRef.current) lavaAudioRef.current.pause();
    }
  }, [gameStatus]);

  const handleGameOver = useCallback(() => {
    if (gameStatus === 'playing') {
        setGameStatus('lost');
        if (lavaAudioRef.current) lavaAudioRef.current.pause();
    }
  }, [gameStatus]);
  
  const handleCollectSound = useCallback(() => {
    if (collectAudioRef.current) {
      collectAudioRef.current.currentTime = 0;
      collectAudioRef.current.play().catch(e => {});
    }
  }, []);

  const handleJoystickMove = useCallback((delta: { x: number; z: number }) => {
    setJoystickDelta(delta);
  }, []);
  
  const allEnemiesDefeated = useMemo(() => enemies.every(e => e.health <= 0), [enemies]);
  if (score === totalCollectibles && allEnemiesDefeated && gameStatus === 'playing') {
    handleGameWon();
  }

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
        score={score}
        setScore={setScore}
        setGameOver={handleGameOver}
        collectibleCount={totalCollectibles}
        lavaAudioRef={lavaAudioRef}
        onCollect={handleCollectSound}
        joystickDelta={joystickDelta}
        isAttacking={isAttacking}
        playerHealth={playerHealth}
        setPlayerHealth={setPlayerHealth}
        enemies={enemies}
        setEnemies={setEnemies}
        playerHealthBarRef={playerHealthBarRef}
        enemyHealthBarRefs={enemyHealthBarRefs}
      />

      <div ref={playerHealthBarRef} className="fixed top-0 left-0 z-40" style={{ display: 'none' }}>
        <HealthBar health={playerHealth} maxHealth={initialPlayerHealth} />
      </div>

      {enemies.map((enemy, index) => (
         <div key={enemy.id} ref={el => enemyHealthBarRefs.current[index] = el} className="fixed top-0 left-0 z-40" style={{ display: 'none' }}>
            <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
         </div>
      ))}

      {isMobile && gameStatus === 'playing' && (
        <>
          <VirtualJoystick onMove={handleJoystickMove} />
          <div className="fixed bottom-16 right-16 z-50 md:hidden portrait:hidden">
              <Button 
                size="icon" 
                className="h-20 w-20 rounded-full"
                onPointerDown={() => setIsAttacking(true)}
                onPointerUp={() => setIsAttacking(false)}
                onPointerLeave={() => setIsAttacking(false)}
              >
                <Sword size={32} />
              </Button>
          </div>
        </>
      )}

      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <h2 className={cn("text-6xl font-bold font-headline", gameStatus === 'won' ? "gradient-text" : "text-red-500")}>
            {gameStatus === 'won' ? 'You Win!' : 'Game Over'}
          </h2>
          <p className="text-xl text-white mt-2">
            {gameStatus === 'won' ? `Final Score: ${score}` : 'The executioners got you.'}
          </p>
          <Button onClick={handleRestart} className="mt-8" size="lg">
            <RotateCw className="mr-2 h-5 w-5" />
            {gameStatus === 'won' ? 'Play Again' : 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
}
