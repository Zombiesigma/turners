"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Enemy = {
    id: string;
    health: number;
    maxHealth: number;
    position: THREE.Vector3;
};

type GameCanvasProps = {
    score: number;
    setScore: (fn: (s: number) => number) => void;
    setGameOver: () => void;
    collectibleCount: number;
    lavaAudioRef: React.RefObject<HTMLAudioElement>;
    onCollect: () => void;
    joystickDelta: { x: number; z: number };
    isAttacking: boolean;
    playerHealth: number;
    setPlayerHealth: (fn: (h: number) => number) => void;
    enemies: Enemy[];
    setEnemies: (fn: (e: Enemy[]) => Enemy[]) => void;
    playerHealthBarRef: React.RefObject<HTMLDivElement>;
    enemyHealthBarRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
};

export function GameCanvas({ 
    setScore, setGameOver, collectibleCount, lavaAudioRef, onCollect, joystickDelta,
    isAttacking, playerHealth, setPlayerHealth, enemies, setEnemies,
    playerHealthBarRef, enemyHealthBarRefs
}: GameCanvasProps) {
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
    // ... shadow camera setup
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    
    // Ground
    const groundTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/rock_b.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(64, 64);
    const planeSize = 120;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), new THREE.MeshStandardMaterial({ map: groundTexture, metalness: 0.1, roughness: 0.8 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lava
    const lavaTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lava/lavatile.jpg');
    lavaTexture.wrapS = THREE.RepeatWrapping;
    lavaTexture.wrapT = THREE.RepeatWrapping;
    lavaTexture.repeat.set(4, 4);
    const lavaMaterial = new THREE.MeshStandardMaterial({ map: lavaTexture, emissiveMap: lavaTexture, emissive: 0xff4400, emissiveIntensity: 1.8, metalness: 0.2, roughness: 0.7 });
    const lavaPools: THREE.Mesh[] = [];
    const lavaPoolGeometries = [ new THREE.PlaneGeometry(10, 30), new THREE.PlaneGeometry(20, 15), new THREE.CircleGeometry(12, 32), new THREE.PlaneGeometry(5, 50) ];
    const lavaPositions = [ new THREE.Vector3(30, 0.01, -20), new THREE.Vector3(-40, 0.01, 10), new THREE.Vector3(15, 0.01, 45), new THREE.Vector3(-10, 0.01, -45) ];
    lavaPoolGeometries.forEach((geom, i) => {
        const lavaPool = new THREE.Mesh(geom, lavaMaterial);
        lavaPool.position.copy(lavaPositions[i]);
        lavaPool.rotation.x = -Math.PI / 2;
        scene.add(lavaPool);
        lavaPools.push(lavaPool);
    });
    const lavaBBs = lavaPools.map(lava => new THREE.Box3().setFromObject(lava).expandByScalar(0.5));

    // Player Capsule
    const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 10, 20), new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.6, roughness: 0.2, emissive: 0xaa8800, emissiveIntensity: 0.2 }));
    player.position.y = 0.8;
    player.castShadow = true;
    scene.add(player);
    const playerBB = new THREE.Box3();
    const playerLight = new THREE.PointLight(0xFFD700, 0.8, 15);
    player.add(playerLight);

    // Enemies ("Algojos")
    const enemyMeshes: THREE.Mesh[] = [];
    const enemyBBs: THREE.Box3[] = [];
    enemies.forEach(enemyData => {
        const enemyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.2, 10, 20), new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.5, roughness: 0.3, emissive: 0x880000 }));
        enemyMesh.position.copy(enemyData.position);
        enemyMesh.castShadow = true;
        scene.add(enemyMesh);
        enemyMeshes.push(enemyMesh);
        enemyBBs.push(new THREE.Box3());
    });
    let playerDamageCooldown = 0;
    
    camera.position.set(0, 5, 6);
    camera.lookAt(player.position);

    // Obstacles
    const obstacles: THREE.Mesh[] = [];
    for (let i = 0; i < 80; i++) {
        const obstacle = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 }));
        let validPosition = false;
        while (!validPosition) {
            obstacle.position.set((Math.random() - 0.5) * (planeSize - 4), 2, (Math.random() - 0.5) * (planeSize - 4));
            validPosition = !lavaBBs.some(lavaBB => lavaBB.intersectsBox(new THREE.Box3().setFromObject(obstacle)));
        }
        obstacle.castShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    const obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

    // Collectibles
    let collectedCount = 0;
    const collectibles: THREE.Mesh[] = [];
    const lightningShape = new THREE.Shape();
    lightningShape.moveTo(0, 0.6); lightningShape.lineTo(-0.2, 0.2); lightningShape.lineTo(-0.2, -0.2); lightningShape.lineTo(0, -0.6); lightningShape.lineTo(0.2, -0.2); lightningShape.lineTo(0.2, 0.2); lightningShape.lineTo(0, 0.6);
    const collectibleGeometry = new THREE.ExtrudeGeometry(lightningShape, { depth: 0.1, bevelEnabled: false });
    collectibleGeometry.center();
    const collectibleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1 });
    for (let i = 0; i < collectibleCount; i++) {
        const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        let validPosition = false;
        while (!validPosition) {
            collectible.position.set((Math.random() - 0.5) * (planeSize - 2), 0.75, (Math.random() - 0.5) * (planeSize - 2));
            const collectibleBB = new THREE.Box3().setFromObject(collectible);
            validPosition = !obstacleBBs.some(obsBB => obsBB.intersectsBox(collectibleBB)) && !lavaBBs.some(lavaBB => lavaBB.intersectsBox(collectibleBB));
        }
        collectible.rotation.x = Math.PI / 2;
        scene.add(collectible);
        collectibles.push(collectible);
    }
    const collectibleBBs = collectibles.map(c => new THREE.Box3().setFromObject(c));

    // Movement and Attack
    const keys: Record<string, boolean> = {};
    document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    let attackCooldown = 0;
    const attackRadius = 3;
    const attackDamage = 10;
    const attackEffect = new THREE.Mesh(new THREE.RingGeometry(attackRadius-0.2, attackRadius, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    attackEffect.rotation.x = -Math.PI/2;
    scene.add(attackEffect);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        // Cooldowns
        if (attackCooldown > 0) attackCooldown -= delta;
        if (playerDamageCooldown > 0) playerDamageCooldown -= delta;
        
        // Player Movement
        const moveDirection = new THREE.Vector3();
        const joystick = joystickDeltaRef.current;
        if (joystick.x !== 0 || joystick.z !== 0) {
            moveDirection.set(joystick.x, 0, joystick.z);
        } else {
            if (keys['w'] || keys['arrowup']) moveDirection.z -= 1;
            if (keys['s'] || keys['arrowdown']) moveDirection.z += 1;
            if (keys['a'] || keys['arrowleft']) moveDirection.x -= 1;
            if (keys['d'] || keys['arrowright']) moveDirection.x += 1;
        }
        moveDirection.normalize().multiplyScalar(5 * delta);
        const newPosition = player.position.clone().add(moveDirection);
        newPosition.x = THREE.MathUtils.clamp(newPosition.x, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        newPosition.z = THREE.MathUtils.clamp(newPosition.z, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        
        const playerNextBB = new THREE.Box3().setFromObject(player).translate(moveDirection);
        if (!obstacleBBs.some(obsBB => playerNextBB.intersectsBox(obsBB))) {
            player.position.copy(newPosition);
        }
        
        // Lava Collision
        playerBB.setFromObject(player);
        if (lavaBBs.some(lavaBB => playerBB.intersectsBox(lavaBB))) player.position.set(0, 0.8, 0);

        // Player Attack
        if ((isAttacking || keys['f']) && attackCooldown <= 0) {
            attackCooldown = 0.5; // 0.5 second cooldown
            attackEffect.position.copy(player.position);
            attackEffect.material.opacity = 0.8;
            enemyMeshes.forEach((enemyMesh, index) => {
                if (enemies[index].health > 0 && player.position.distanceTo(enemyMesh.position) < attackRadius) {
                    setEnemies(prev => prev.map(e => e.id === enemies[index].id ? { ...e, health: e.health - attackDamage } : e));
                }
            });
        }
        if (attackEffect.material.opacity > 0) {
            attackEffect.material.opacity -= delta * 4;
        }

        // Enemy AI and Collision
        enemyMeshes.forEach((enemyMesh, index) => {
            if (enemies[index].health <= 0) {
                if (enemyMesh.visible) {
                    enemyMesh.visible = false;
                    // Optional: add a dying animation/effect here
                }
                return;
            };

            const enemySpeed = 2.5 * delta;
            const directionToPlayer = new THREE.Vector3().subVectors(player.position, enemyMesh.position).normalize();
            enemyMesh.position.add(directionToPlayer.multiplyScalar(enemySpeed));
            
            enemyBBs[index].setFromObject(enemyMesh);
            playerBB.setFromObject(player);
            if (enemyBBs[index].intersectsBox(playerBB) && playerDamageCooldown <= 0) {
                playerDamageCooldown = 1.0; // 1 second immunity
                setPlayerHealth(h => h - 15);
                if (playerHealth - 15 <= 0) setGameOver();
            }
        });

        // Collectibles
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
            }
        }

        // Update camera and audio
        camera.position.lerp(player.position.clone().add(new THREE.Vector3(0, 5, 6)), 0.05);
        camera.lookAt(player.position);
        lavaTexture.offset.y += delta * 0.1;
        // ... lava audio logic as before

        // Update health bar positions
        const updateHealthBarPosition = (mesh: THREE.Mesh, ref: React.RefObject<HTMLDivElement>, yOffset = 1.2) => {
            if (!ref.current || !mesh.visible) {
                if(ref.current) ref.current.style.display = 'none';
                return;
            }
            const vector = new THREE.Vector3();
            mesh.getWorldPosition(vector);
            vector.y += yOffset;
            vector.project(camera);
            const onScreen = vector.z < 1 && vector.x > -1 && vector.x < 1 && vector.y > -1 && vector.y < 1;
            if (onScreen) {
                ref.current.style.display = 'block';
                const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                const y = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
                ref.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            } else {
                ref.current.style.display = 'none';
            }
        };

        updateHealthBarPosition(player, playerHealthBarRef, 0.8);
        enemyMeshes.forEach((em, i) => updateHealthBarPosition(em, { current: enemyHealthBarRefs.current[i] }));
        
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
        document.removeEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
        document.removeEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
        if (mountNode && renderer.domElement) {
            mountNode.removeChild(renderer.domElement);
        }
        cancelAnimationFrame(animationFrameId);
        
        if (lavaAudioRef.current) lavaAudioRef.current.pause();

        scene.traverse(object => {
             if (object instanceof THREE.Mesh) {
                object.geometry?.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    material.map?.dispose();
                    material.emissiveMap?.dispose();
                    material.dispose();
                });
            }
        });
        groundTexture.dispose();
        lavaTexture.dispose();
    };
  }, [collectibleCount, setGameOver, setScore, lavaAudioRef, onCollect, isAttacking, enemies, setEnemies, playerHealth, setPlayerHealth, enemyHealthBarRefs, playerHealthBarRef]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
