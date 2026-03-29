// @ts-nocheck
"use client";

import { useEffect, useRef } from 'react';

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles: {x: number, y: number, vx: number, vy: number, size: number, color: string}[] = [];
    const particleCount = 100;
    const colors = ["#FFD700", "#FF7E00", "#FFFFFF"];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    let mouse = { x: width/2, y: height/2 };
    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    };
    document.addEventListener('mousemove', handleMouseMove);

    function animate() {
        requestAnimationFrame(animate);
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.5;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Add lines to nearby particles and mouse
            const connectDistance = 150;

            particles.forEach(p2 => {
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < connectDistance) {
                ctx.beginPath();
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = (connectDistance - dist) / connectDistance * 0.2;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            });

            const dxMouse = p.x - mouse.x;
            const dyMouse = p.y - mouse.y;
            const distMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
            if (distMouse < connectDistance) {
                 ctx.beginPath();
                 ctx.strokeStyle = p.color;
                 ctx.globalAlpha = (connectDistance - distMouse) / connectDistance * 0.1;
                 ctx.moveTo(p.x, p.y);
                 ctx.lineTo(mouse.x, mouse.y);
                 ctx.stroke();
            }
        });
    }

    animate();
    
    return () => {
        window.removeEventListener('resize', () => {
            if(canvas) {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }
        });
        document.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />;
}
