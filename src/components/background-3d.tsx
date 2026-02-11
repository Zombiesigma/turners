// @ts-nocheck
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Background3D() {
  const mountRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: mountNode, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Layer 1
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ 
        size: 0.02, 
        color: 0xFFD700, 
        transparent: true, 
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Layer 2
    const particlesGeometry2 = new THREE.BufferGeometry();
    const particlesCount2 = 2000;
    const posArray2 = new Float32Array(particlesCount2 * 3);
    for (let i = 0; i < particlesCount2 * 3; i++) {
        posArray2[i] = (Math.random() - 0.5) * 30;
    }
    particlesGeometry2.setAttribute('position', new THREE.BufferAttribute(posArray2, 3));
    const particlesMaterial2 = new THREE.PointsMaterial({ 
        size: 0.015,
        color: 0xADD8E6,
        transparent: true, 
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh2 = new THREE.Points(particlesGeometry2, particlesMaterial2);
    scene.add(particlesMesh2);


    camera.position.z = 5;

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    document.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        particlesMesh.rotation.y = elapsedTime * 0.02;
        particlesMesh2.rotation.y = elapsedTime * 0.01;
        
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={mountRef} className="fixed top-0 left-0 -z-10" />;
}
