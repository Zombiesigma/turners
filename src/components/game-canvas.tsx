'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Enemy = {
    id: string;
    health: number;
    maxHealth: number;
    position: THREE.Vector3;
    aiState: 'chasing' | 'wandering' | 'collecting';
    targetPosition: THREE.Vector3;
    aiTimer: number;
};

type FloatingText = {
    id: number;
    element: HTMLDivElement;
    position: THREE.Vector3;
    lifespan: number;
    yVelocity: number;
};

type GameCanvasProps = {
    score: number;
    setScore: (fn: (s: number) => number) => void;
    setGameOver: () => void;
    collectibleCount: number;
    lavaAudioRef: React.RefObject<HTMLAudioElement>;
    walkAudioRef: React.RefObject<HTMLAudioElement>;
    onCollect: () => void;
    onAttack: () => void;
    onJump: () => void;
    onEnemyDefeated: () => void;
    joystickDelta: { x: number; z: number };
    isAttacking: boolean;
    setIsAttacking: (v: boolean) => void;
    isJumping: boolean;
    setIsJumping: (v: boolean) => void;
    playerHealth: number;
    setPlayerHealth: (fn: (h: number) => number) => void;
    maxPlayerHealth: number;
    enemies: Enemy[];
    setEnemies: (fn: (e: Enemy[]) => Enemy[]) => void;
    playerHealthBarRef: React.RefObject<HTMLDivElement>;
    enemyHealthBarRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    floatingTextContainerRef: React.RefObject<HTMLDivElement>;
};

export function GameCanvas({ 
    score, setScore, setGameOver, collectibleCount, lavaAudioRef, walkAudioRef,
    onCollect, onAttack, onJump, onEnemyDefeated, joystickDelta, isAttacking, setIsAttacking,
    isJumping, setIsJumping, playerHealth, setPlayerHealth, maxPlayerHealth, enemies, setEnemies,
    playerHealthBarRef, enemyHealthBarRefs, floatingTextContainerRef
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const gameState = useRef({ score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth });

  const floatingTexts = useRef<FloatingText[]>([]);
  const playerLavaDamageCooldown = useRef(0);
  const playerDamageCooldown = useRef(0);
  const nextTextId = useRef(0);

  useEffect(() => {
    gameState.current = { score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth };
  }, [score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth]);
  
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    let animationFrameId: number;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 100);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountNode.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();

    const portfolioTextures = PlaceHolderImages
        .filter(p => p.id.startsWith('painting-') || p.id.startsWith('book-cover-') || p.id.startsWith('certificate-'))
        .map(img => textureLoader.load(img.imageUrl));

    const obstacleMaterials = portfolioTextures.map(texture => new THREE.MeshStandardMaterial({ map: texture, metalness: 0.1, roughness: 0.8 }));
    
    const groundTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/rock_b.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(64, 64);
    const planeSize = 120;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), new THREE.MeshStandardMaterial({ map: groundTexture, metalness: 0.1, roughness: 0.8 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const lavaTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lava/lavatile.jpg');
    lavaTexture.wrapS = THREE.RepeatWrapping;
    lavaTexture.wrapT = THREE.RepeatWrapping;
    lavaTexture.repeat.set(64, 64);
    const lavaMaterial = new THREE.MeshStandardMaterial({ map: lavaTexture, emissiveMap: lavaTexture, emissive: 0xff4400, emissiveIntensity: 1.8, metalness: 0.2, roughness: 0.7 });
    
    const lavaPools: THREE.Mesh[] = [];

    const riverShape1 = new THREE.Shape();
    riverShape1.moveTo(-60, -10);
    riverShape1.bezierCurveTo(-40, 5, -20, -15, 0, -20);
    riverShape1.bezierCurveTo(20, -25, 40, -10, 60, -5);
    riverShape1.lineTo(60, 8);
    riverShape1.bezierCurveTo(40, 2, 20, -13, 0, -8);
    riverShape1.bezierCurveTo(-20, -3, -40, 15, -60, 2);
    riverShape1.closePath();

    const riverGeom1 = new THREE.ShapeGeometry(riverShape1);
    const riverMesh1 = new THREE.Mesh(riverGeom1, lavaMaterial);
    riverMesh1.rotation.x = -Math.PI / 2;
    riverMesh1.position.y = 0.01;
    scene.add(riverMesh1);
    lavaPools.push(riverMesh1);

    const riverShape2 = new THREE.Shape();
    riverShape2.moveTo(10, 60);
    riverShape2.bezierCurveTo(25, 40, 15, 20, 0, 15);
    riverShape2.bezierCurveTo(-15, 10, -25, 30, -5, 60);
    riverShape2.closePath();

    const riverGeom2 = new THREE.ShapeGeometry(riverShape2);
    const riverMesh2 = new THREE.Mesh(riverGeom2, lavaMaterial);
    riverMesh2.rotation.x = -Math.PI / 2;
    riverMesh2.position.y = 0.01;
    scene.add(riverMesh2);
    lavaPools.push(riverMesh2);

    const lavaBBs = lavaPools.map(lava => new THREE.Box3().setFromObject(lava));

    const obstacles: THREE.Mesh[] = [];
    for (let i = 0; i < 80; i++) {
        const material = obstacleMaterials[i % obstacleMaterials.length];
        const obstacle = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.5), material);
        
        let validPosition = false;
        while (!validPosition) {
            obstacle.position.set((Math.random() - 0.5) * (planeSize - 4), 2.5, (Math.random() - 0.5) * (planeSize - 4));
            const obstacleBB = new THREE.Box3().setFromObject(obstacle);
            validPosition = !lavaBBs.some(lavaBB => lavaBB.intersectsBox(obstacleBB));
        }
        obstacle.rotation.y = Math.random() * Math.PI;
        obstacle.castShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    const obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

    const collectibles: THREE.Mesh[] = [];
    const lightningShape = new THREE.Shape();
    lightningShape.moveTo(0, 0.6); lightningShape.lineTo(-0.2, 0.2); lightningShape.lineTo(0.2, 0.2); lightningShape.lineTo(0, -0.6); lightningShape.lineTo(-0.2, -0.2); lightningShape.lineTo(0.2, -0.2); lightningShape.lineTo(0, 0.6);
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
    
    const spawnFloatingText = (text: string, color: string, position: THREE.Vector3) => {
        const container = floatingTextContainerRef.current;
        if (!container) return;

        const element = document.createElement('div');
        element.textContent = text;
        element.style.color = color;
        element.className = 'floating-text';
        container.appendChild(element);
        
        floatingTexts.current.push({
            id: nextTextId.current++,
            element,
            position: position.clone(),
            lifespan: 1.0,
            yVelocity: 2.0,
        });
    };

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => keys[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key.toLowerCase()] = false;
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const attackEffect = new THREE.Mesh(new THREE.RingGeometry(2.8, 3, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    attackEffect.rotation.x = -Math.PI/2;
    scene.add(attackEffect);
    
    const loader = new GLTFLoader();

    loader.load('/models/GoldenRobot.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.8, 0.8, 0.8);
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
            }
        });
        const animations = gltf.animations;

        // Player
        const player = model.clone();
        player.position.y = 0.8;
        scene.add(player);
        const playerBB = new THREE.Box3();
        const playerLight = new THREE.PointLight(0xFFD700, 0.8, 15);
        player.add(playerLight);
        const playerVelocity = new THREE.Vector3();
        const gravity = 30.0;
        const playerMixer = new THREE.AnimationMixer(player);
        const playerAnims = {
            idle: animations.find(c => c.name.toLowerCase().includes("idle")) ? playerMixer.clipAction(animations.find(c => c.name.toLowerCase().includes("idle"))!) : null,
            walk: animations.find(c => c.name.toLowerCase().includes("walk")) ? playerMixer.clipAction(animations.find(c => c.name.toLowerCase().includes("walk"))!) : null,
            attack: animations.find(c => c.name.toLowerCase().includes("attack")) ? playerMixer.clipAction(animations.find(c => c.name.toLowerCase().includes("attack"))!) : null,
            jump: animations.find(c => c.name.toLowerCase().includes("jump")) ? playerMixer.clipAction(animations.find(c => c.name.toLowerCase().includes("jump"))!) : null
        };
        if(playerAnims.attack) {
            playerAnims.attack.setLoop(THREE.LoopOnce, 1);
            playerAnims.attack.clampWhenFinished = true;
        }
        if(playerAnims.jump) {
            playerAnims.jump.setLoop(THREE.LoopOnce, 1);
            playerAnims.jump.clampWhenFinished = true;
        }

        let currentAction: THREE.AnimationAction | null = playerAnims.idle;
        if (currentAction) currentAction.play();

        // Enemies
        type EnemyObject = { 
            mesh: THREE.Group, 
            bb: THREE.Box3 | null, 
            mixer: THREE.AnimationMixer, 
            anims: typeof playerAnims, 
            currentAction: THREE.AnimationAction | null 
        };

        const enemyObjects: EnemyObject[] = [];
        const enemyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x660000,
            emissiveIntensity: 0.5
        });

        gameState.current.enemies.forEach(enemyData => {
            const enemyMesh = model.clone();
            enemyMesh.userData.id = enemyData.id;
            enemyMesh.position.copy(enemyData.position);
            enemyMesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material = enemyMaterial;
                }
            });
            scene.add(enemyMesh);
            const mixer = new THREE.AnimationMixer(enemyMesh);
            const anims = {
                idle: animations.find(c => c.name.toLowerCase().includes("idle")) ? mixer.clipAction(animations.find(c => c.name.toLowerCase().includes("idle"))!) : null,
                walk: animations.find(c => c.name.toLowerCase().includes("walk")) ? mixer.clipAction(animations.find(c => c.name.toLowerCase().includes("walk"))!) : null,
                attack: animations.find(c => c.name.toLowerCase().includes("attack")) ? mixer.clipAction(animations.find(c => c.name.toLowerCase().includes("attack"))!) : null,
                jump: null // Enemies don't jump
            };
            if(anims.attack) {
                anims.attack.setLoop(THREE.LoopOnce, 1);
                anims.attack.clampWhenFinished = true;
            }

            let currentEnemyAction: THREE.AnimationAction | null = anims.idle;
            if (currentEnemyAction) currentEnemyAction.play();

            enemyObjects.push({
                mesh: enemyMesh,
                bb: new THREE.Box3(),
                mixer: mixer,
                anims: anims,
                currentAction: currentEnemyAction,
            });
        });
        
        let attackCooldown = 0;
        const attackRadius = 3;
        const attackDamage = 10;
        
        camera.position.set(0, 5, 6);
        camera.lookAt(player.position);

        const clock = new THREE.Clock();

        function switchAction(from: THREE.AnimationAction | null, to: THREE.AnimationAction | null, duration = 0.2): THREE.AnimationAction | null {
            if (!to || from === to) return to;
            if (from) {
                from.fadeOut(duration);
            }
            if (to) {
                to.reset().fadeIn(duration).play();
            }
            return to;
        }

        playerMixer.addEventListener('finished', (e) => {
            if (e.action === playerAnims.attack || e.action === playerAnims.jump) {
                 const isMoving = (keys['w'] || keys['arrowup'] || keys['s'] || keys['arrowdown'] || keys['a'] || keys['arrowleft'] || keys['d'] || keys['arrowright'] || joystickDelta.x !== 0 || joystickDelta.z !== 0);
                 if(isMoving){
                     currentAction = switchAction(currentAction, playerAnims.walk);
                 } else {
                     currentAction = switchAction(currentAction, playerAnims.idle);
                 }
            }
        });

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            
            if (gameState.current.playerHealth <= 0) return;

            playerMixer.update(delta);
            enemyObjects.forEach(e => e.mixer.update(delta));

            if (attackCooldown > 0) attackCooldown -= delta;
            if (playerDamageCooldown.current > 0) playerDamageCooldown.current -= delta;
            if (playerLavaDamageCooldown.current > 0) playerLavaDamageCooldown.current -= delta;
            
            const onGround = player.position.y <= 0.8;
            playerVelocity.y -= gravity * delta;
            player.position.y += playerVelocity.y * delta;
            if (player.position.y < 0.8) {
                player.position.y = 0.8;
                playerVelocity.y = 0;
            }

            const isTryingToJump = gameState.current.isJumping || keys[' '];
            if (isTryingToJump && onGround) {
                playerVelocity.y = 10;
                onJump();
                if(playerAnims.jump) currentAction = switchAction(currentAction, playerAnims.jump);
                if (gameState.current.isJumping) setIsJumping(false);
            }

            const moveDirection = new THREE.Vector3();
            const joystick = gameState.current.joystickDelta;
            if (joystick.x !== 0 || joystick.z !== 0) {
                moveDirection.set(joystick.x, 0, joystick.z);
            } else {
                if (keys['w'] || keys['arrowup']) moveDirection.z -= 1;
                if (keys['s'] || keys['arrowdown']) moveDirection.z += 1;
                if (keys['a'] || keys['arrowleft']) moveDirection.x -= 1;
                if (keys['d'] || keys['arrowright']) moveDirection.x += 1;
            }
            
            const isMovingHorizontally = moveDirection.length() > 0.1;
            if (isMovingHorizontally) {
                moveDirection.normalize().multiplyScalar(5 * delta);
                const horizontalMove = new THREE.Vector3(moveDirection.x, 0, moveDirection.z);
                const tempPlayerBB = playerBB.clone().translate(horizontalMove);

                let collision = false;
                for (const obsBB of obstacleBBs) {
                    if (tempPlayerBB.intersectsBox(obsBB)) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) player.position.add(horizontalMove);
                player.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
            }
            playerBB.setFromObject(player);
            
            if (onGround && !playerAnims.attack?.isRunning() && !playerAnims.jump?.isRunning()) {
                 if (isMovingHorizontally) {
                    if (playerAnims.walk) currentAction = switchAction(currentAction, playerAnims.walk);
                } else {
                    if (playerAnims.idle) currentAction = switchAction(currentAction, playerAnims.idle);
                }
            }
            
            const isTryingToAttack = gameState.current.isAttacking || keys['f'];
            if (isTryingToAttack && attackCooldown <= 0) {
                attackCooldown = 0.5;
                if(playerAnims.attack) {
                    currentAction = switchAction(currentAction, playerAnims.attack);
                }
                onAttack();
                attackEffect.position.copy(player.position);
                attackEffect.material.opacity = 0.8;
                
                const damagedEnemies = new Set<string>();
                enemyObjects.forEach((enemyObj) => {
                    const enemyData = gameState.current.enemies.find(e => e.id === enemyObj.mesh.userData.id);
                    if (enemyObj.mesh.visible && enemyData && enemyData.health > 0 && player.position.distanceTo(enemyObj.mesh.position) < attackRadius) {
                        damagedEnemies.add(enemyData.id);
                    }
                });
                if (damagedEnemies.size > 0) {
                    setEnemies(prev => prev.map(e => {
                        if (damagedEnemies.has(e.id)) {
                            const newHealth = Math.max(0, e.health - attackDamage);
                            if (e.health > 0 && newHealth <= 0) onEnemyDefeated();
                            spawnFloatingText(`-${attackDamage}`, '#ffcc00', e.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.8, Math.random()-0.5)));
                            return { ...e, health: newHealth };
                        }
                        return e;
                    }));
                }
                if (gameState.current.isAttacking) setIsAttacking(false);
            }
            if (attackEffect.material.opacity > 0) attackEffect.material.opacity -= delta * 4;

            player.position.x = THREE.MathUtils.clamp(player.position.x, -planeSize/2 + 0.5, planeSize/2 - 0.5);
            player.position.z = THREE.MathUtils.clamp(player.position.z, -planeSize/2 + 0.5, planeSize/2 - 0.5);
            
            const playerFeetBB = new THREE.Box3().setFromCenterAndSize(player.position.clone().setY(player.position.y - 0.9), new THREE.Vector3(0.6, 0.2, 0.6));
            const inLava = lavaBBs.some(lavaBB => lavaBB.intersectsBox(playerFeetBB));
            
            if (inLava && gameState.current.playerHealth > 0) {
                if (playerLavaDamageCooldown.current <= 0) {
                    const damageAmount = 10;
                    setPlayerHealth(h => Math.max(0, h - damageAmount));
                    spawnFloatingText(`-${Math.round(damageAmount)}`, '#ff4400', player.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.5, Math.random()-0.5)));
                    playerLavaDamageCooldown.current = 0.5;
                    if (gameState.current.playerHealth - damageAmount <= 0) setGameOver();
                }
                if (lavaAudioRef.current && lavaAudioRef.current.paused) {
                    lavaAudioRef.current.play().catch(e => {});
                }
            } else {
                if (lavaAudioRef.current && !lavaAudioRef.current.paused) {
                    lavaAudioRef.current.pause();
                }
            }

            enemyObjects.forEach((enemyObj) => {
                const enemyData = gameState.current.enemies.find(e => e.id === enemyObj.mesh.userData.id);
                 if (!enemyData || enemyData.health <= 0) {
                    if (enemyObj.mesh.visible) {
                        enemyObj.currentAction = switchAction(enemyObj.currentAction, null);
                        enemyObj.mesh.visible = false;
                        enemyObj.bb = null;
                    }
                    return;
                }
                // AI Logic (simplified for brevity)
                const distanceToPlayer = enemyObj.mesh.position.distanceTo(player.position);
                const enemySpeed = (distanceToPlayer < 20 ? 2.8 : 2.0) * delta;
                const directionToTarget = new THREE.Vector3().subVectors(player.position, enemyObj.mesh.position).normalize();
                enemyObj.mesh.position.add(directionToTarget.multiplyScalar(enemySpeed));
                 if(directionToTarget.lengthSq() > 0) {
                    enemyObj.mesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
                }

                if(enemyObj.anims.attack && enemyObj.anims.attack.isRunning()){
                    // do nothing, let attack finish
                } else if(distanceToPlayer > 1) {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.walk);
                } else {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.idle);
                }

                if (enemyObj.bb) {
                    enemyObj.bb.setFromObject(enemyObj.mesh);
                    if (enemyObj.bb.intersectsBox(playerBB) && playerDamageCooldown.current <= 0) {
                        onAttack();
                        enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.attack);
                        playerDamageCooldown.current = 1.0;
                        const damage = 15;
                        setPlayerHealth(h => {
                            const newHealth = Math.max(0, h - damage);
                            if (newHealth <= 0) setGameOver();
                            return newHealth;
                        });
                        spawnFloatingText(`-${damage}`, '#ff4400', player.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.5, Math.random()-0.5)));
                    }
                }
            });

            for (let i = collectibles.length - 1; i >= 0; i--) {
                const collectible = collectibles[i];
                collectible.rotation.z += 0.05;
                if (playerBB.intersectsBox(collectibleBBs[i])) {
                    scene.remove(collectible);
                    collectibles.splice(i, 1);
                    collectibleBBs.splice(i, 1);
                    setScore(s => s + 1);
                    setPlayerHealth(h => Math.min(h + 5, gameState.current.maxPlayerHealth));
                    spawnFloatingText(`+5`, '#22c55e', player.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.5, Math.random()-0.5)));
                    onCollect();
                }
            }
            
            if (isMovingHorizontally && onGround) {
                if (walkAudioRef.current && walkAudioRef.current.paused) {
                    walkAudioRef.current.play().catch(e => {});
                }
            } else {
                if (walkAudioRef.current && !walkAudioRef.current.paused) {
                    walkAudioRef.current.pause();
                }
            }

            camera.position.lerp(player.position.clone().add(new THREE.Vector3(0, 5, 6)), 0.05);
            camera.lookAt(player.position);
            lavaTexture.offset.y += delta * 0.1;

            const updateHealthBarPosition = (mesh: THREE.Object3D, ref: React.RefObject<HTMLDivElement>, yOffset = 2.2) => {
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

            updateHealthBarPosition(player, playerHealthBarRef, 2.2);
            enemyObjects.forEach((em, i) => em.mesh && updateHealthBarPosition(em.mesh, { current: enemyHealthBarRefs.current[i] }, 2.5));
            
            for (let i = floatingTexts.current.length - 1; i >= 0; i--) {
                const text = floatingTexts.current[i];
                text.lifespan -= delta;
                text.position.y += text.yVelocity * delta;

                if (text.lifespan <= 0) {
                    if (floatingTextContainerRef.current && text.element.parentNode === floatingTextContainerRef.current) {
                        floatingTextContainerRef.current.removeChild(text.element);
                    }
                    floatingTexts.current.splice(i, 1);
                } else {
                    const vector = text.position.clone().project(camera);
                    const onScreen = vector.z < 1 && vector.x > -1 && vector.x < 1 && vector.y > -1 && vector.y < 1;
                    if (onScreen) {
                        text.element.style.display = 'block';
                        const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                        const y = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
                        text.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                        text.element.style.opacity = `${text.lifespan}`;
                    } else {
                        text.element.style.display = 'none';
                    }
                }
            }
            
            renderer.render(scene, camera);
        };
        animate();
    }, undefined, (error) => {
        console.error('An error happened while loading the model.', error);
    });

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
        
        if (lavaAudioRef.current) lavaAudioRef.current.pause();
        if (walkAudioRef.current) walkAudioRef.current.pause();

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
        portfolioTextures.forEach(t => t.dispose());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
