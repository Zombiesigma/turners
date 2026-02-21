"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type GameCanvasProps = {
    setScore: (fn: (s: number) => number) => void;
    setGameWon: () => void;
    collectibleCount: number;
};

export function GameCanvas({ setScore, setGameWon, collectibleCount }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Darker background
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountNode.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 150;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);
    
    // Ground
    const planeSize = 120;
    const groundGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    const grid = new THREE.GridHelper(planeSize, planeSize, 0x888888, 0x444444);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    scene.add(grid);

    // Player Cube
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700, 
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0xaa8800,
        emissiveIntensity: 0.2
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    player.castShadow = true;
    scene.add(player);
    const playerBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

    camera.position.set(0, 15, 18);
    camera.lookAt(player.position);

    // Obstacles
    const obstacles: THREE.Mesh[] = [];
    const obstacleGeometry = new THREE.BoxGeometry(2, 4, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    const obstacleCount = 80;
    for (let i = 0; i < obstacleCount; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            (Math.random() - 0.5) * (planeSize - 4),
            2,
            (Math.random() - 0.5) * (planeSize - 4)
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    const obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

    // Collectibles
    let collectedCount = 0;
    const collectibles: THREE.Mesh[] = [];
    const collectibleGeometry = new THREE.TorusGeometry(0.5, 0.15, 16, 100);
    const collectibleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1, roughness: 0.1, metalness: 0.8 });
    
    for (let i = 0; i < collectibleCount; i++) {
        const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        let validPosition = false;
        while (!validPosition) {
            collectible.position.set(
                (Math.random() - 0.5) * (planeSize - 2),
                0.75,
                (Math.random() - 0.5) * (planeSize - 2)
            );
            validPosition = true;
            for (const obsBB of obstacleBBs) {
                if (obsBB.containsPoint(collectible.position)) {
                    validPosition = false;
                    break;
                }
            }
        }
        collectible.rotation.x = Math.PI / 2;
        collectible.castShadow = true;
        scene.add(collectible);
        collectibles.push(collectible);
    }
    const collectibleBBs = collectibles.map(c => new THREE.Box3().setFromObject(c));

    // Movement
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (event: KeyboardEvent) => { keys[event.key] = true; };
    const handleKeyUp = (event: KeyboardEvent) => { keys[event.key] = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const moveSpeed = 5 * delta;

        const moveDirection = new THREE.Vector3();
        if (keys['ArrowUp']) moveDirection.z -= 1;
        if (keys['ArrowDown']) moveDirection.z += 1;
        if (keys['ArrowLeft']) moveDirection.x -= 1;
        if (keys['ArrowRight']) moveDirection.x += 1;
        moveDirection.normalize();

        const newPosition = player.position.clone().add(moveDirection.clone().multiplyScalar(moveSpeed));
        
        // Boundary checks
        const halfPlane = planeSize / 2;
        newPosition.x = THREE.MathUtils.clamp(newPosition.x, -halfPlane + 0.5, halfPlane - 0.5);
        newPosition.z = THREE.MathUtils.clamp(newPosition.z, -halfPlane + 0.5, halfPlane - 0.5);

        // Obstacle collision check
        playerBB.setFromObject(player);
        const playerNextBB = playerBB.clone().translate(newPosition.clone().sub(player.position));
        let collision = false;
        for (const obsBB of obstacleBBs) {
            if (playerNextBB.intersectsBox(obsBB)) {
                collision = true;
                break;
            }
        }
        
        if (!collision) {
            player.position.copy(newPosition);
        }

        // Follow camera
        const cameraOffset = new THREE.Vector3(0, 15, 18);
        const targetCameraPosition = player.position.clone().add(cameraOffset);
        camera.position.lerp(targetCameraPosition, 0.05);
        camera.lookAt(player.position);
        
        // Animate collectibles and check for collision
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            collectible.rotation.z += 0.05;
            
            playerBB.setFromObject(player);
            collectibleBBs[i].setFromObject(collectible);
            
            if (playerBB.intersectsBox(collectibleBBs[i])) {
                scene.remove(collectible);
                collectibles.splice(i, 1);
                collectibleBBs.splice(i, 1);
                setScore(s => s + 1);
                collectedCount++;
                if (collectedCount === collectibleCount) {
                    setGameWon();
                }
            }
        }

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
        if (mountNode && renderer.domElement) {
            mountNode.removeChild(renderer.domElement);
        }
        cancelAnimationFrame(animationFrameId);
        // Dispose of Three.js objects
        scene.traverse(object => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        (object.material as THREE.Material).dispose();
                    }
                }
            }
        });
    };
  }, [collectibleCount, setGameWon, setScore]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
