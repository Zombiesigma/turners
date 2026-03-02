'use client';

import { useState, useRef, useCallback } from 'react';

type VirtualJoystickProps = {
  onMove: (delta: { x: number; z: number }) => void;
};

export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const handleInteractionStart = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    setIsDragging(true);
    const rect = baseRef.current.getBoundingClientRect();
    updatePosition(clientX, clientY, rect);
  }, []);

  const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    updatePosition(clientX, clientY, rect);
  }, [isDragging]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, z: 0 });
  }, [onMove]);

  const updatePosition = (clientX: number, clientY: number, rect: DOMRect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2 - (knobRef.current?.clientWidth ?? 32) / 2;

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    setPosition({ x: dx, y: dy });
    onMove({
      x: dx / maxDistance,
      z: -dy / maxDistance, // Y-screen-axis maps to Z-game-axis, inverted
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleInteractionMove(e.clientX, e.clientY);
    }
  }

  return (
    <div
      ref={baseRef}
      className="fixed bottom-16 left-1/2 -translate-x-1/2 sm:left-20 sm:translate-x-0 z-50 h-36 w-36 rounded-full bg-black/20 backdrop-blur-sm md:hidden portrait:hidden"
      onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleInteractionEnd}
      onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
    >
      <div
        ref={knobRef}
        className="absolute h-16 w-16 rounded-full bg-white/30"
        style={{
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
          top: '50%',
          left: '50%',
        }}
      />
    </div>
  );
}
