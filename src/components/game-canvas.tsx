"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type GameCanvasProps = {
    setScore: (fn: (s: number) => number) => void;
    setGameWon: () => void;
    collectibleCount: number;
    lavaAudioRef: React.RefObject<HTMLAudioElement>;
    onCollect: () => void;
    joystickDelta: { x: number; z: number };
};

export function GameCanvas({ setScore, setGameWon, collectibleCount, lavaAudioRef, onCollect, joystickDelta }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const joystickDeltaRef = useRef(joystickDelta);

  useEffect(() => {
    joystickDeltaRef.current = joystickDelta;
  }, [joystickDelta]);
  
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 100);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountNode.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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

    const textureLoader = new THREE.TextureLoader();
    
    // Ground
    const groundTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/rock_b.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(64, 64);

    const planeSize = 120;
    const groundGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        map: groundTexture,
        metalness: 0.1, 
        roughness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lava
    const lavaTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lava/lavatile.jpg');
    lavaTexture.wrapS = THREE.RepeatWrapping;
    lavaTexture.wrapT = THREE.RepeatWrapping;
    lavaTexture.repeat.set(4, 4);

    const lavaMaterial = new THREE.MeshStandardMaterial({
        map: lavaTexture,
        emissiveMap: lavaTexture,
        emissive: 0xff4400,
        emissiveIntensity: 1.8,
        metalness: 0.2,
        roughness: 0.7,
    });
    
    const lavaPools: THREE.Mesh[] = [];
    const lavaPoolGeometries = [
        new THREE.PlaneGeometry(10, 30),
        new THREE.PlaneGeometry(20, 15),
        new THREE.CircleGeometry(12, 32),
        new THREE.PlaneGeometry(5, 50),
    ];
    const lavaPositions = [
        new THREE.Vector3(30, 0.01, -20),
        new THREE.Vector3(-40, 0.01, 10),
        new THREE.Vector3(15, 0.01, 45),
        new THREE.Vector3(-10, 0.01, -45),
    ];
    const lavaRotations = [ 0.2, 0, 0, 1.57 ];

    lavaPoolGeometries.forEach((geom, i) => {
        const lavaPool = new THREE.Mesh(geom, lavaMaterial);
        lavaPool.position.copy(lavaPositions[i]);
        lavaPool.rotation.x = -Math.PI / 2;
        lavaPool.rotation.z = lavaRotations[i];
        scene.add(lavaPool);
        lavaPools.push(lavaPool);
    });

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

    // Add a point light to the player
    const playerLight = new THREE.PointLight(0xFFD700, 0.8, 15);
    playerLight.castShadow = false;
    player.add(playerLight);

    camera.position.set(0, 5, 6);
    camera.lookAt(player.position);

    // Obstacles
    const obstacles: THREE.Mesh[] = [];
    const obstacleGeometry = new THREE.BoxGeometry(2, 4, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    const obstacleCount = 80;
    const lavaBBs = lavaPools.map(lava => new THREE.Box3().setFromObject(lava).expandByScalar(0.5));
    
    for (let i = 0; i < obstacleCount; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        let validPosition = false;
        while (!validPosition) {
            obstacle.position.set(
                (Math.random() - 0.5) * (planeSize - 4),
                2,
                (Math.random() - 0.5) * (planeSize - 4)
            );
            validPosition = true;
            const obsBB = new THREE.Box3().setFromObject(obstacle);
             for (const lavaBB of lavaBBs) {
                if (lavaBB.intersectsBox(obsBB)) {
                    validPosition = false;
                    break;
                }
            }
        }
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    const obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

    // Collectibles
    let collectedCount = 0;
    const collectibles: THREE.Mesh[] = [];
    
    const lightningShape = new THREE.Shape();
    lightningShape.moveTo(0, 0.6);
    lightningShape.lineTo(-0.2, 0.2);
    lightningShape.lineTo(-0.2, -0.2);
    lightningShape.lineTo(0, -0.6);
    lightningShape.lineTo(0.2, -0.2);
    lightningShape.lineTo(0.2, 0.2);
    lightningShape.lineTo(0, 0.6);

    const extrudeSettings = {
        steps: 1,
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 1
    };

    const collectibleGeometry = new THREE.ExtrudeGeometry(lightningShape, extrudeSettings);
    collectibleGeometry.center();

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
            const collectibleBB = new THREE.Box3().setFromObject(collectible);
            for (const obsBB of obstacleBBs) {
                if (obsBB.intersectsBox(collectibleBB)) {
                    validPosition = false;
                    break;
                }
            }
            if (validPosition) {
              for (const lavaBB of lavaBBs) {
                  if (lavaBB.intersectsBox(collectibleBB)) {
                      validPosition = false;
                      break;
                  }
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
    const handleKeyDown = (event: KeyboardEvent) => { keys[event.key.toLowerCase()] = true; };
    const handleKeyUp = (event: KeyboardEvent) => { keys[event.key.toLowerCase()] = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const moveSpeed = 5 * delta;

        lavaTexture.offset.y += delta * 0.1;

        const moveDirection = new THREE.Vector3();
        
        const currentJoystick = joystickDeltaRef.current;
        if (currentJoystick.x !== 0 || currentJoystick.z !== 0) {
            moveDirection.x = currentJoystick.x;
            moveDirection.z = currentJoystick.z;
        } else {
            if (keys['arrowup'] || keys['w']) moveDirection.z -= 1;
            if (keys['arrowdown'] || keys['s']) moveDirection.z += 1;
            if (keys['arrowleft'] || keys['a']) moveDirection.x -= 1;
            if (keys['arrowright'] || keys['d']) moveDirection.x += 1;
        }
        
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

        // Lava collision (restart)
        playerBB.setFromObject(player);
        for (const lavaBB of lavaBBs) {
            if(playerBB.intersectsBox(lavaBB)) {
                 player.position.set(0, 0.5, 0);
                 break;
            }
        }

        // Follow camera
        const cameraOffset = new THREE.Vector3(0, 5, 6);
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
                onCollect();
                collectedCount++;
                if (collectedCount === collectibleCount) {
                    setGameWon();
                }
            }
        }

        // Lava audio proximity logic
        let minDistanceToLava = Infinity;
        for (const lava of lavaPools) {
            const distance = player.position.distanceTo(lava.position);
            if (distance < minDistanceToLava) {
                minDistanceToLava = distance;
            }
        }

        const audioEl = lavaAudioRef.current;
        if (audioEl) {
            const maxAudioDistance = 25;
            if (minDistanceToLava < maxAudioDistance) {
                const volume = Math.max(0, 1 - (minDistanceToLava / maxAudioDistance));
                audioEl.volume = Math.pow(volume, 2); // Use pow for a more noticeable falloff
                if (audioEl.paused) {
                    audioEl.play().catch(e => {});
                }
            } else {
                if (!audioEl.paused) {
                    audioEl.pause();
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
        
        if (lavaAudioRef.current) {
            lavaAudioRef.current.pause();
        }

        // Dispose of Three.js objects
        scene.traverse(object => {
             if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => {
                            if (material.map) material.map.dispose();
                            if (material.emissiveMap) material.emissiveMap.dispose();
                            material.dispose();
                        });
                    } else {
                        if (object.material.map) object.material.map.dispose();
                        if (object.material.emissiveMap) object.material.emissiveMap.dispose();
                        (object.material as THREE.Material).dispose();
                    }
                }
            }
        });
        groundTexture.dispose();
        lavaTexture.dispose();
    };
  }, [collectibleCount, setGameWon, setScore, lavaAudioRef, onCollect]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
