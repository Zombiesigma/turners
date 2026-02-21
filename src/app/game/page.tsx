import { GameCanvas } from '@/components/game-canvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GamePage() {
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
        <h1 className="text-4xl font-bold font-headline gradient-text">3D Cube Runner</h1>
        <p className="text-muted-foreground mt-2">Use arrow keys to move the cube and collect the spinning rings.</p>
      </div>
      <GameCanvas />
    </div>
  );
}
