// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

export function Loader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    mountNode.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const material = new THREE.PointsMaterial({ size: 0.02, color: 0xd4a574, transparent: true, opacity: 0.8 });
    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    const geometry = new THREE.IcosahedronGeometry(1.5, 0);
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.3;
    line.material.transparent = true;
    line.material.color = new THREE.Color(0xe8b4a0);
    scene.add(line);

    camera.position.z = 4;

    const animate = () => {
        if (!loading) return;
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.001;
        line.rotation.x += 0.002;
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountNode) return;
      camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const interval = setInterval(() => {
        setProgress(oldProgress => {
            if (oldProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => setLoading(false), 500);
                return 100;
            }
            const diff = Math.random() * 10;
            return Math.min(oldProgress + diff, 100);
        });
    }, 150);

    return () => {
        window.removeEventListener('resize', handleResize);
        mountNode.removeChild(renderer.domElement);
        clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      document.body.style.overflow = '';
      setTimeout(() => setVisible(false), 1000);
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background z-[200] flex flex-col justify-center items-center transition-opacity duration-1000",
      loading ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div ref={mountRef} className="absolute inset-0 z-0"/>
      <div className="relative z-10 text-center">
        <p className="text-lg font-mono uppercase tracking-widest text-primary/80 animate-pulse">GUNTUR PADILAH...</p>
        <div className="mt-4 w-48 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
