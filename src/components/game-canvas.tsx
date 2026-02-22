'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);

    const hemiLight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 2.5 );
    scene.add( hemiLight );
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    const d = 50;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    
    const groundTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg');
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
    const lavaMaterial = new THREE.MeshStandardMaterial({ map: lavaTexture, emissiveMap: lavaTexture, emissive: 0xff4400, emissiveIntensity: 2.2, metalness: 0.4, roughness: 0.6 });
    
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

    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.2 });
    const roadWidth = 8;
    const roadSegments = [
        { x: 0, z: 0, length: planeSize, horizontal: true },
        { x: 0, z: 45, length: planeSize, horizontal: true },
        { x: 0, z: -45, length: planeSize, horizontal: true },
        { x: 0, z: 0, length: planeSize, horizontal: false },
        { x: 45, z: 0, length: planeSize, horizontal: false },
        { x: -45, z: 0, length: planeSize, horizontal: false },
    ];
    const roadBBs = roadSegments.map(seg => {
        const roadGeom = new THREE.BoxGeometry(seg.horizontal ? seg.length : roadWidth, 0.05, seg.horizontal ? roadWidth : seg.length);
        const road = new THREE.Mesh(roadGeom, roadMaterial);
        road.position.set(seg.x, 0.02, seg.z);
        road.receiveShadow = true;
        scene.add(road);
        return new THREE.Box3().setFromObject(road);
    });

    const obstacles: THREE.Object3D[] = [];
    const buildingMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x454545, metalness: 0.2, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.2, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.2, roughness: 0.7 }),
    ];

    for (let i = 0; i < 70; i++) {
        const width = Math.random() * 7 + 6;
        const height = Math.random() * 30 + 20;
        const depth = Math.random() * 7 + 6;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
        const building = new THREE.Mesh(buildingGeometry, material);
        
        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < 50) {
            building.position.set(
                (Math.random() - 0.5) * (planeSize - width), 
                height / 2, 
                (Math.random() - 0.5) * (planeSize - depth)
            );
            const buildingBB = new THREE.Box3().setFromObject(building);

            let collision = lavaBBs.some(lavaBB => lavaBB.intersectsBox(buildingBB)) || roadBBs.some(rBB => rBB.intersectsBox(buildingBB));
            
            if (!collision) {
                 for (const obs of obstacles) {
                    const obsBB = new THREE.Box3().setFromObject(obs);
                    if (obsBB.intersectsBox(buildingBB)) {
                        collision = true;
                        break;
                    }
                }
            }

            validPosition = !collision;
            attempts++;
        }
        
        if (validPosition) {
            building.castShadow = true;
            building.receiveShadow = true;
            scene.add(building);
            obstacles.push(building);
        }
    }

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2e0f });
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });

    for (let i = 0; i < 150; i++) {
        const tree = new THREE.Group();
        const trunkHeight = Math.random() * 3 + 3;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.4, trunkHeight, 8),
            trunkMaterial
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        tree.add(trunk);

        const leavesHeight = Math.random() * 4 + 3;
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2, leavesHeight, 8),
            leavesMaterial
        );
        leaves.position.y = trunkHeight + leavesHeight * 0.4;
        leaves.castShadow = true;
        tree.add(leaves);

        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < 50) {
            tree.position.set(
                (Math.random() - 0.5) * planeSize,
                0,
                (Math.random() - 0.5) * planeSize
            );
            const treeBB = new THREE.Box3().setFromObject(tree);
            const onRoad = roadBBs.some(roadBB => roadBB.intersectsBox(treeBB));
            const inLava = lavaBBs.some(lavaBB => lavaBB.intersectsBox(treeBB));
            const inBuilding = obstacles.some(obs => new THREE.Box3().setFromObject(obs).intersectsBox(treeBB));
            
            if (!onRoad && !inLava && !inBuilding) {
                validPosition = true;
            }
            attempts++;
        }
        
        if (validPosition) {
            scene.add(tree);
            obstacles.push(tree);
        }
    }


    const obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

    const grassTexture = textureLoader.load('https://raw.githubusercontent.com/al-ro/dat-ecosystem-archive/master/spike.city/src/assets/images/grass.png');
    grassTexture.colorSpace = THREE.SRGBColorSpace;

    const grassBladeGeometry = new THREE.PlaneGeometry(0.7, 0.7);
    grassBladeGeometry.translate(0, 0.7 / 2, 0);

    const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.8,
    });
    
    const uniforms = {
        time: { value: 0 },
    };

    grassMaterial.onBeforeCompile = shader => {
        shader.uniforms.time = uniforms.time;
        shader.vertexShader = `
            uniform float time;
            varying vec2 vUv;
            ${shader.vertexShader}
        `;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            float windStrength = 0.2;
            float windSpeed = 2.0;
            
            float wind = sin(transformed.x * 0.5 + time * windSpeed) * windStrength * uv.y;
            transformed.x += wind;
            `
        );
    };

    const grassInstanceCount = 75000;
    const grassInstancedMesh = new THREE.InstancedMesh(grassBladeGeometry, grassMaterial, grassInstanceCount);
    grassInstancedMesh.receiveShadow = true;
    grassInstancedMesh.castShadow = true;
    scene.add(grassInstancedMesh);

    const dummy = new THREE.Object3D();
    let instances = 0;

    for (let i = 0; i < grassInstanceCount; i++) {
        dummy.position.set(
            (Math.random() - 0.5) * planeSize,
            0,
            (Math.random() - 0.5) * planeSize
        );
        
        dummy.scale.setScalar(0.5 + Math.random() * 0.7);
        dummy.rotation.y = Math.random() * Math.PI;

        dummy.updateMatrix();

        const checkPoint = dummy.position;
        
        let onRoad = roadBBs.some(roadBB => roadBB.containsPoint(checkPoint));
        let inLava = lavaBBs.some(lavaBB => lavaBB.containsPoint(checkPoint));
        let inBuilding = obstacleBBs.some(obsBB => obsBB.containsPoint(checkPoint));

        if (!onRoad && !inLava && !inBuilding) {
            grassInstancedMesh.setMatrixAt(instances++, dummy.matrix);
        }
        if (instances >= grassInstanceCount) break;
    }
    grassInstancedMesh.instanceMatrix.needsUpdate = true;
    grassInstancedMesh.count = instances;


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
    
    let player: THREE.Group | null = null;
    let playerMixer: THREE.AnimationMixer | null = null;
    let playerAnims: Record<string, THREE.AnimationAction | null> = {};
    const playerBB = new THREE.Box3();
    const playerVelocity = new THREE.Vector3();
    let currentAction: THREE.AnimationAction | null = null;
    let attackCooldown = 0;
    type EnemyObject = { 
        mesh: THREE.Group, 
        bb: THREE.Box3 | null, 
        mixer: THREE.AnimationMixer, 
        anims: typeof playerAnims, 
        currentAction: THREE.AnimationAction | null 
    };
    const enemyObjects: EnemyObject[] = [];

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

        player = model.clone();
        player.position.y = 0.8;
        scene.add(player);
        const playerLight = new THREE.PointLight(0xFFD700, 0.8, 15);
        player.add(playerLight);
        
        playerMixer = new THREE.AnimationMixer(player);
        const idleClip = animations.find(c => c.name.toLowerCase().includes("idle"));
        const walkClip = animations.find(c => ["walk", "run", "running"].some(name => c.name.toLowerCase().includes(name)));
        const attackClip = animations.find(c => c.name.toLowerCase().includes("attack") || c.name.toLowerCase().includes("punch"));
        const jumpClip = animations.find(c => c.name.toLowerCase().includes("jump"));
        
        playerAnims = {
            idle: idleClip ? playerMixer.clipAction(idleClip) : null,
            walk: walkClip ? playerMixer.clipAction(walkClip) : null,
            attack: attackClip ? playerMixer.clipAction(attackClip) : null,
            jump: jumpClip ? playerMixer.clipAction(jumpClip) : null
        };
        if(playerAnims.attack) {
            playerAnims.attack.setLoop(THREE.LoopOnce, 1);
            playerAnims.attack.clampWhenFinished = true;
        }
        if(playerAnims.jump) {
            playerAnims.jump.setLoop(THREE.LoopOnce, 1);
            playerAnims.jump.clampWhenFinished = true;
        }

        currentAction = playerAnims.idle;
        if (currentAction) currentAction.play();

        const enemyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x660000,
            emissiveIntensity: 0.5
        });

        gameState.current.enemies.forEach(enemyData => {
            if (!enemyData) return;
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
                idle: idleClip ? mixer.clipAction(idleClip) : null,
                walk: walkClip ? mixer.clipAction(walkClip) : null,
                attack: attackClip ? mixer.clipAction(attackClip) : null,
                jump: null
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

    }, undefined, (error) => {
        console.error('An error happened while loading the model.', error);
    });

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    
    function switchAction(from: THREE.AnimationAction | null, to: THREE.AnimationAction | null, duration = 0.2): THREE.AnimationAction | null {
        if (!to || from === to) return from;
        if (from) {
            from.fadeOut(duration);
        }
        if (to) {
            to.reset().fadeIn(duration).play();
        }
        return to;
    }
    
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        uniforms.time.value = elapsedTime;
        
        lavaTexture.offset.y += delta * 0.1;
        if (attackEffect.material.opacity > 0) attackEffect.material.opacity -= delta * 4;

        if (!player || !playerMixer) {
            renderer.render(scene, camera);
            return;
        }

        playerMixer.update(delta);
        enemyObjects.forEach(e => e.mixer.update(delta));
        
        if (gameState.current.playerHealth <= 0) {
            renderer.render(scene, camera);
            return;
        }

        if (attackCooldown > 0) attackCooldown -= delta;
        if (playerDamageCooldown.current > 0) playerDamageCooldown.current -= delta;
        if (playerLavaDamageCooldown.current > 0) playerLavaDamageCooldown.current -= delta;
        
        const onGround = player.position.y <= 0.8;
        const gravity = 30.0;
        playerVelocity.y -= gravity * delta;
        player.position.y += playerVelocity.y * delta;
        if (player.position.y < 0.8) {
            player.position.y = 0.8;
            playerVelocity.y = 0;
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
        
        const finalMoveDirection = new THREE.Vector3();
        if (isMovingHorizontally) {
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0;
            cameraDirection.normalize();

            const rightDirection = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();
            finalMoveDirection.add(cameraDirection.multiplyScalar(-moveDirection.z)).add(rightDirection.multiplyScalar(moveDirection.x));

            finalMoveDirection.normalize();
            const horizontalMove = finalMoveDirection.clone().multiplyScalar(5 * delta);
            
            const tempPlayerBB = playerBB.clone().translate(horizontalMove);
            let collision = obstacleBBs.some(obsBB => tempPlayerBB.intersectsBox(obsBB));

            if (!collision) player.position.add(horizontalMove);

            const targetRotation = Math.atan2(finalMoveDirection.x, finalMoveDirection.z);
            player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, 0.2);
        }
        playerBB.setFromObject(player);

        if (onGround) {
            const isTryingToJump = (gameState.current.isJumping || keys[' ']);
            const isTryingToAttack = (gameState.current.isAttacking || keys['f']);

            if (isTryingToAttack && attackCooldown <= 0) {
                attackCooldown = 0.5;
                if(playerAnims.attack) currentAction = switchAction(currentAction, playerAnims.attack);
                onAttack();
                attackEffect.position.copy(player.position);
                attackEffect.material.opacity = 0.8;
                
                const attackRadius = 3;
                const attackDamage = 10;
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

            } else if (isTryingToJump) {
                playerVelocity.y = 10;
                if(playerAnims.jump) currentAction = switchAction(currentAction, playerAnims.jump);
                onJump();
                if (gameState.current.isJumping) setIsJumping(false);

            } else {
                if (!playerAnims.attack?.isRunning() && !playerAnims.jump?.isRunning()) {
                    if (isMovingHorizontally) {
                        currentAction = switchAction(currentAction, playerAnims.walk);
                    } else {
                        currentAction = switchAction(currentAction, playerAnims.idle);
                    }
                }
            }
        }
        
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

        enemyObjects.forEach((enemyObj, index) => {
            const enemyData = gameState.current.enemies[index];
            if (!enemyData || enemyData.health <= 0) {
                if (enemyObj.mesh.visible) {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, null);
                    enemyObj.mesh.visible = false;
                    enemyObj.bb = null;
                }
                return;
            }

            enemyData.aiTimer -= delta;
            const distanceToPlayer = enemyObj.mesh.position.distanceTo(player.position);
            let moving = false;

            // --- State Transitions ---
            if (enemyData.aiState === 'wandering') {
                if (distanceToPlayer < 25) { // Detection range
                    enemyData.aiState = 'chasing';
                }
            } else if (enemyData.aiState === 'chasing') {
                if (distanceToPlayer > 35) { // Lose range
                    enemyData.aiState = 'wandering';
                    enemyData.aiTimer = 0; // Find new wander point immediately
                }
            }

            // --- Action Logic ---
            // Attack is highest priority
            if (distanceToPlayer <= 2.5 && !enemyObj.anims.attack?.isRunning()) {
                const directionToTarget = new THREE.Vector3().subVectors(player.position, enemyObj.mesh.position).normalize();
                enemyObj.mesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
                if (playerDamageCooldown.current <= 0) {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.attack, 0.1);
                    playerDamageCooldown.current = 1.2; // Enemy attack speed
                    // Use timeout to apply damage mid-animation
                    setTimeout(() => {
                        if (gameState.current.playerHealth > 0 && player.position.distanceTo(enemyObj.mesh.position) < 2.8) {
                            const damage = 15;
                            setPlayerHealth(h => {
                                const newHealth = Math.max(0, h - damage);
                                if (h > 0 && newHealth <= 0) setGameOver();
                                return newHealth;
                            });
                            spawnFloatingText(`-${damage}`, '#ff4400', player.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.5, Math.random()-0.5)));
                        }
                    }, 250);
                } else {
                     enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.idle, 0.2);
                }
            } 
            // Movement logic if not attacking
            else if (!enemyObj.anims.attack?.isRunning()) {
                let currentTarget = new THREE.Vector3();
                if (enemyData.aiState === 'chasing') {
                    currentTarget.copy(player.position);
                } else { // Wandering
                    if (enemyData.aiTimer <= 0 || enemyObj.mesh.position.distanceTo(enemyData.targetPosition) < 2) {
                        const newTarget = new THREE.Vector3(
                            (Math.random() - 0.5) * (planeSize - 20),
                            0.8,
                            (Math.random() - 0.5) * (planeSize - 20)
                        );
                        enemyData.targetPosition.copy(newTarget);
                        enemyData.aiTimer = 5 + Math.random() * 5;
                    }
                    currentTarget.copy(enemyData.targetPosition);
                }

                const directionToTarget = new THREE.Vector3().subVectors(currentTarget, enemyObj.mesh.position);
                if (directionToTarget.length() > 1.5) {
                    directionToTarget.y = 0; // Don't move up/down
                    directionToTarget.normalize();
                    
                    const enemySpeed = (enemyData.aiState === 'chasing' ? 3.2 : 1.8) * delta;
                    
                    // Simple collision avoidance
                    const nextPos = enemyObj.mesh.position.clone().add(directionToTarget.clone().multiplyScalar(enemySpeed));
                    const enemyBodyBB = new THREE.Box3().setFromCenterAndSize(nextPos.clone().setY(nextPos.y + 1), new THREE.Vector3(1, 2, 1));

                    let collision = obstacleBBs.some(obsBB => obsBB.intersectsBox(enemyBodyBB));
                    
                    if (!collision) {
                        enemyObj.mesh.position.add(directionToTarget.clone().multiplyScalar(enemySpeed));
                        enemyObj.mesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
                        moving = true;
                    } else {
                        // Hit a wall, stop and trigger new wander point if stuck
                        if (enemyData.aiState === 'chasing') {
                            enemyData.aiState = 'wandering';
                            enemyData.aiTimer = 0;
                        }
                    }
                }
            }

            // --- Animation Logic ---
            if (!enemyObj.anims.attack?.isRunning()) {
                if (moving) {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.walk, 0.2);
                } else {
                    enemyObj.currentAction = switchAction(enemyObj.currentAction, enemyObj.anims.idle, 0.3);
                }
            }
            
            if (enemyObj.bb) {
                enemyObj.bb.setFromObject(enemyObj.mesh);
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

        const cameraOffset = new THREE.Vector3(0, 2.5, 4.5);
        cameraOffset.applyQuaternion(player.quaternion);
        const idealCameraPosition = player.position.clone().add(cameraOffset);
        
        const targetLookAt = player.position.clone().add(new THREE.Vector3(0, 1.8, 0));
        
        // Add a simple camera collision check to prevent it from going through walls
        raycaster.set(targetLookAt, idealCameraPosition.clone().sub(targetLookAt).normalize());
        const intersections = raycaster.intersectObjects(obstacles, false);
        if (intersections.length > 0) {
            const intersectionPoint = intersections[0].point;
            const distanceToPlayer = targetLookAt.distanceTo(intersectionPoint);
            if (distanceToPlayer < cameraOffset.length()) {
                 idealCameraPosition.copy(intersectionPoint);
            }
        }

        camera.position.lerp(idealCameraPosition, 0.08);
        camera.lookAt(targetLookAt);
        
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
        grassTexture.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
