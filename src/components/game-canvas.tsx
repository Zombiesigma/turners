"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Enemy = {
    id: string;
    health: number;
    maxHealth: number;
    position: THREE.Vector3;
    aiState: 'chasing' | 'wandering' | 'collecting';
    targetPosition: THREE.Vector3;
    aiTimer: number;
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
};

export function GameCanvas({ 
    score, setScore, setGameOver, collectibleCount, lavaAudioRef, walkAudioRef,
    onCollect, onAttack, onJump, onEnemyDefeated, joystickDelta, isAttacking, setIsAttacking,
    isJumping, setIsJumping, playerHealth, setPlayerHealth, maxPlayerHealth, enemies, setEnemies,
    playerHealthBarRef, enemyHealthBarRefs
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const gameState = useRef({ score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth });

  useEffect(() => {
    gameState.current = { score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth };
  }, [score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth]);
  
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

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
    lavaTexture.repeat.set(32, 32);
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

    const lavaBBs = lavaPools.map(lava => new THREE.Box3().setFromObject(lava).expandByScalar(0.5));

    const createCharacterModel = (isPlayer: boolean): { model: THREE.Group, limbs: any } => {
        const group = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({
            color: isPlayer ? 0xFFD700 : 0xcc0000,
            metalness: 0.5,
            roughness: 0.3,
            emissive: isPlayer ? 0xaa8800 : 0x880000,
            emissiveIntensity: 0.3
        });

        const bodyHeight = 1.0;
        const bodyRadius = 0.4;
        const headRadius = 0.3;
        const limbRadius = 0.1;
        const armLength = 0.8;
        const legLength = 1.0;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 16), material);
        body.position.y = legLength / 2 + bodyHeight / 2;
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 16, 16), material);
        head.position.y = body.position.y + bodyHeight / 2 + headRadius * 0.9;
        group.add(head);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(limbRadius, limbRadius, armLength, 8), material);
        const leftArm = arm.clone();
        const rightArm = arm.clone();
        leftArm.position.set(-(bodyRadius + limbRadius), body.position.y + bodyHeight / 2 - limbRadius, 0);
        rightArm.position.set(bodyRadius + limbRadius, body.position.y + bodyHeight / 2 - limbRadius, 0);
        group.add(leftArm, rightArm);
        
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(limbRadius, limbRadius * 0.8, legLength, 8), material);
        const leftLeg = leg.clone();
        const rightLeg = leg.clone();
        leftLeg.position.set(-bodyRadius * 0.5, legLength/2, 0);
        rightLeg.position.set(bodyRadius * 0.5, legLength/2, 0);
        group.add(leftLeg, rightLeg);
        
        group.position.y = -legLength;

        group.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
            }
        });

        const limbs = { head, leftArm, rightArm, leftLeg, rightLeg };
        return { model: group, limbs };
    };
    
    const playerModelData = createCharacterModel(true);
    const player = playerModelData.model;
    const playerLimbs = playerModelData.limbs;
    player.position.y = 0.8;
    scene.add(player);
    const playerBB = new THREE.Box3();
    const playerLight = new THREE.PointLight(0xFFD700, 0.8, 15);
    player.add(playerLight);
    const playerVelocity = new THREE.Vector3();
    const gravity = 30.0;

    const enemyObjects: { mesh: THREE.Group, limbs: any, bb: THREE.Box3 | null }[] = [];
    gameState.current.enemies.forEach(enemyData => {
        const enemyModelData = createCharacterModel(false);
        enemyModelData.model.position.copy(enemyData.position);
        scene.add(enemyModelData.model);
        enemyObjects.push({
            mesh: enemyModelData.model,
            limbs: enemyModelData.limbs,
            bb: new THREE.Box3()
        });
    });
    let playerDamageCooldown = 0;
    
    camera.position.set(0, 5, 6);
    camera.lookAt(player.position);

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

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => keys[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key.toLowerCase()] = false;
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    let attackCooldown = 0;
    const attackRadius = 3;
    const attackDamage = 10;
    const attackEffect = new THREE.Mesh(new THREE.RingGeometry(attackRadius-0.2, attackRadius, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    attackEffect.rotation.x = -Math.PI/2;
    scene.add(attackEffect);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;
    let attackAnimation = 0;
    let enemyAttackAnimations = new Array(enemies.length).fill(0);

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        
        if (gameState.current.playerHealth <= 0) return;

        if (attackCooldown > 0) attackCooldown -= delta;
        if (playerDamageCooldown > 0) playerDamageCooldown -= delta;
        
        // --- Physics and Movement ---
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
        
        const isMovingHorizontally = moveDirection.length() > 0;
        if (isMovingHorizontally) {
          moveDirection.normalize().multiplyScalar(5 * delta);
          const horizontalMove = new THREE.Vector3(moveDirection.x, 0, moveDirection.z);
          
          const tempPlayerBB = new THREE.Box3().copy(playerBB).translate(horizontalMove);

          if (!obstacleBBs.some(obsBB => tempPlayerBB.intersectsBox(obsBB))) {
              player.position.add(horizontalMove);
          }
           player.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
        }
        playerBB.setFromObject(player);


        player.position.x = THREE.MathUtils.clamp(player.position.x, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        
        // --- Lava Damage ---
        const playerFeetBB = new THREE.Box3().setFromCenterAndSize(
            player.position.clone().setY(player.position.y - 0.9),
            new THREE.Vector3(0.6, 0.2, 0.6)
        );
        const inLava = lavaBBs.some(lavaBB => lavaBB.intersectsBox(playerFeetBB));
        
        let isBurning = false;
        if (inLava && gameState.current.playerHealth > 0) {
            isBurning = true;
            const damagePerSecond = 50;
            const newHealth = Math.max(0, gameState.current.playerHealth - damagePerSecond * delta);
            setPlayerHealth(h => newHealth);
            
            if (newHealth <= 0) {
                setGameOver();
                return;
            }

            if (lavaAudioRef.current?.paused) {
                lavaAudioRef.current.play().catch(e => {});
            }
        } else {
             if (!lavaAudioRef.current?.paused) {
                lavaAudioRef.current.pause();
            }
        }

        // --- Animations & Visual Effects ---
        if (isBurning) {
            player.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.emissiveIntensity = 2.0;
                    material.emissive.setHex(Math.sin(elapsedTime * 30) > 0 ? 0xff4400 : 0xaa8800);
                }
            });
        } else {
             player.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (material.emissiveIntensity !== 0.3) {
                         material.emissiveIntensity = 0.3;
                         material.emissive.setHex(0xaa8800);
                    }
                }
            });
        }

        const walkCycle = Math.sin(elapsedTime * 8) * 0.7;

        if (attackAnimation > 0) {
            attackAnimation -= delta;
            const progress = Math.sin((1 - attackAnimation / 0.4) * Math.PI);
            playerLimbs.rightArm.rotation.x = -progress * 2;
        }

        if (attackAnimation <= 0) {
            if (isMovingHorizontally && onGround) {
                playerLimbs.leftArm.rotation.x = walkCycle;
                playerLimbs.rightArm.rotation.x = -walkCycle;
                playerLimbs.leftLeg.rotation.x = -walkCycle;
                playerLimbs.rightLeg.rotation.x = walkCycle;
            } else {
                playerLimbs.leftArm.rotation.x = THREE.MathUtils.lerp(playerLimbs.leftArm.rotation.x, 0, delta * 10);
                playerLimbs.rightArm.rotation.x = THREE.MathUtils.lerp(playerLimbs.rightArm.rotation.x, 0, delta * 10);
                playerLimbs.leftLeg.rotation.x = THREE.MathUtils.lerp(playerLimbs.leftLeg.rotation.x, 0, delta * 10);
                playerLimbs.rightLeg.rotation.x = THREE.MathUtils.lerp(playerLimbs.rightLeg.rotation.x, 0, delta * 10);
            }
        } else {
            if (isMovingHorizontally && onGround) {
                playerLimbs.leftArm.rotation.x = walkCycle;
                playerLimbs.leftLeg.rotation.x = -walkCycle;
                playerLimbs.rightLeg.rotation.x = walkCycle;
            }
        }

        // --- Actions ---
        const isTryingToAttack = gameState.current.isAttacking || keys['f'];
        if (isTryingToAttack && attackCooldown <= 0) {
            attackCooldown = 0.5;
            attackAnimation = 0.4;
            onAttack();
            attackEffect.position.copy(player.position);
            attackEffect.material.opacity = 0.8;
            
            const damagedEnemies = new Set<string>();
            enemyObjects.forEach((enemyObj, index) => {
                const enemyData = gameState.current.enemies[index];
                if (enemyObj.mesh.visible && enemyData.health > 0 && player.position.distanceTo(enemyObj.mesh.position) < attackRadius) {
                    damagedEnemies.add(enemyData.id);
                }
            });
             if (damagedEnemies.size > 0) {
                setEnemies(prev => prev.map(e => {
                    if (damagedEnemies.has(e.id)) {
                        const newHealth = Math.max(0, e.health - attackDamage);
                        if (e.health > 0 && newHealth <= 0) {
                            onEnemyDefeated();
                        }
                        return { ...e, health: newHealth };
                    }
                    return e;
                }));
            }
            if (gameState.current.isAttacking) setIsAttacking(false);
        }
        if (attackEffect.material.opacity > 0) {
            attackEffect.material.opacity -= delta * 4;
        }

        // --- AI ---
        enemyObjects.forEach((enemyObj, index) => {
            const enemyData = gameState.current.enemies[index];
            const enemyMesh = enemyObj.mesh;
            const enemyLimbs = enemyObj.limbs;

            if (enemyData.health <= 0) {
                if (enemyMesh.visible) {
                    enemyMesh.visible = false;
                    enemyObj.bb = null;
                }
                return;
            };

            const newEnemyData = { ...enemyData, aiTimer: enemyData.aiTimer - delta };
            let needsStateUpdate = false;

            if (newEnemyData.aiTimer <= 0) {
                needsStateUpdate = true;
                newEnemyData.aiTimer = Math.random() * 4 + 3;
                const distanceToPlayer = enemyMesh.position.distanceTo(player.position);
                const decision = Math.random();

                if (distanceToPlayer < 20 && decision < 0.6) {
                    newEnemyData.aiState = 'chasing';
                } else if (collectibles.length > 0 && decision < 0.85) {
                    newEnemyData.aiState = 'collecting';
                } else {
                    newEnemyData.aiState = 'wandering';
                }
            }

            if (newEnemyData.aiState === 'chasing') {
                 if (!newEnemyData.targetPosition.equals(player.position)) {
                    newEnemyData.targetPosition = player.position.clone();
                    needsStateUpdate = true;
                 }
            } else if (needsStateUpdate) {
                 if (newEnemyData.aiState === 'wandering') {
                    newEnemyData.targetPosition = new THREE.Vector3((Math.random() - 0.5) * (planeSize - 10), 0.8, (Math.random() - 0.5) * (planeSize - 10));
                } else if (newEnemyData.aiState === 'collecting') {
                    let closestCollectible: THREE.Mesh | null = null;
                    let minDistance = Infinity;
                    collectibles.forEach(c => {
                        if (!c.visible) return;
                        const dist = enemyMesh.position.distanceTo(c.position);
                        if (dist < minDistance) { minDistance = dist; closestCollectible = c; }
                    });
                    if (closestCollectible) {
                        newEnemyData.targetPosition = closestCollectible.position.clone();
                    } else {
                        newEnemyData.aiState = 'wandering';
                        newEnemyData.targetPosition = new THREE.Vector3((Math.random() - 0.5) * (planeSize - 10), 0.8, (Math.random() - 0.5) * (planeSize - 10));
                    }
                }
            }

            if (needsStateUpdate) {
                setEnemies(prev => prev.map(e => e.id === newEnemyData.id ? newEnemyData : e));
            }
            
            const enemySpeed = (newEnemyData.aiState === 'chasing' ? 2.8 : 2.0) * delta;
            const directionToTarget = new THREE.Vector3().subVectors(enemyData.targetPosition, enemyMesh.position).normalize();
            enemyMesh.position.add(directionToTarget.multiplyScalar(enemySpeed));
            if(directionToTarget.lengthSq() > 0) {
                 enemyMesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
            }
            
            if (enemyObj.bb) {
                enemyObj.bb.setFromObject(enemyMesh);
                if (enemyObj.bb.intersectsBox(playerBB) && playerDamageCooldown <= 0) {
                    onAttack();
                    playerDamageCooldown = 1.0;
                    enemyAttackAnimations[index] = 0.4;
                    const newHealth = Math.max(0, gameState.current.playerHealth - 15);
                    setPlayerHealth(h => newHealth);
                    if (newHealth <= 0) {
                        setGameOver();
                        return;
                    }
                }
            }

            const enemyIsMoving = directionToTarget.length() > 0.1;
            if (enemyAttackAnimations[index] > 0) {
                enemyAttackAnimations[index] -= delta;
                const progress = Math.sin((1 - enemyAttackAnimations[index] / 0.4) * Math.PI);
                enemyLimbs.rightArm.rotation.x = -progress * 2;
            }
             if (enemyAttackAnimations[index] <= 0) {
                if(enemyIsMoving) {
                    const enemyWalkCycle = Math.sin(elapsedTime * 6 + index) * 0.7;
                    enemyLimbs.leftArm.rotation.x = enemyWalkCycle;
                    enemyLimbs.rightArm.rotation.x = -enemyWalkCycle;
                    enemyLimbs.leftLeg.rotation.x = -enemyWalkCycle;
                    enemyLimbs.rightLeg.rotation.x = enemyWalkCycle;
                } else {
                    enemyLimbs.leftArm.rotation.x = THREE.MathUtils.lerp(enemyLimbs.leftArm.rotation.x, 0, delta * 10);
                    enemyLimbs.rightArm.rotation.x = THREE.MathUtils.lerp(enemyLimbs.rightArm.rotation.x, 0, delta * 10);
                    enemyLimbs.leftLeg.rotation.x = THREE.MathUtils.lerp(enemyLimbs.leftLeg.rotation.x, 0, delta * 10);
                    enemyLimbs.rightLeg.rotation.x = THREE.MathUtils.lerp(enemyLimbs.rightLeg.rotation.x, 0, delta * 10);
                }
            }
        });

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
                setPlayerHealth(h => Math.min(h + 5, gameState.current.maxPlayerHealth));
                onCollect();
            }
        }
        
        if (isMovingHorizontally && onGround) {
            if (walkAudioRef.current?.paused) {
                walkAudioRef.current.play().catch(e => {});
            }
        } else {
             if (!walkAudioRef.current?.paused) {
                walkAudioRef.current?.pause();
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
    };
  }, [collectibleCount, setGameOver, setScore, lavaAudioRef, walkAudioRef, onCollect, onAttack, onJump, onEnemyDefeated, setEnemies, setPlayerHealth, enemyHealthBarRefs, playerHealthBarRef, setIsAttacking, setIsJumping, maxPlayerHealth]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
