// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function GameCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountNode.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Player Cube
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    player.castShadow = true;
    scene.add(player);

    camera.position.set(0, 5, 8);
    camera.lookAt(player.position);

    // Collectibles
    const collectibles = [];
    const collectibleGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const collectibleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
    
    for (let i = 0; i < 10; i++) {
        const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        collectible.position.set(
            (Math.random() - 0.5) * 28,
            0.75,
            (Math.random() - 0.5) * 28
        );
        collectible.rotation.x = Math.PI / 2;
        collectible.castShadow = true;
        scene.add(collectible);
        collectibles.push(collectible);
    }

    // Movement
    const keys = {};
    const handleKeyDown = (event: KeyboardEvent) => { keys[event.key] = true; };
    const handleKeyUp = (event: KeyboardEvent) => { keys[event.key] = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    const speed = 0.1;

    const animate = () => {
        requestAnimationFrame(animate);

        // Player movement
        if (keys['ArrowUp']) player.position.z -= speed;
        if (keys['ArrowDown']) player.position.z += speed;
        if (keys['ArrowLeft']) player.position.x -= speed;
        if (keys['ArrowRight']) player.position.x += speed;

        // Follow camera
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 8;
        camera.lookAt(player.position);
        
        // Animate collectibles and check for collision
        collectibles.forEach((collectible, index) => {
            collectible.rotation.z += 0.02;
            const distance = player.position.distanceTo(collectible.position);
            if (distance < 1) {
                scene.remove(collectible);
                collectibles.splice(index, 1);
                setScore(s => s + 1);
            }
        });

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
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        mountNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
        <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />
        <div className="absolute top-4 right-4 z-20 bg-black/50 text-white p-3 rounded-lg font-mono">
            Score: {score}
        </div>
    </>
  );
}
