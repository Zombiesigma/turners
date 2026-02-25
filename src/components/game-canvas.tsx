'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const createWindowTexture = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = 64;
    canvas.height = 256;

    context.fillStyle = '#222228'; // Dark building color
    context.fillRect(0, 0, canvas.width, canvas.height);

    const windowCols = 4;
    const windowRows = 10;
    const colWidth = canvas.width / windowCols;
    const rowHeight = canvas.height / windowRows;

    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            const x = col * colWidth;
            const y = row * rowHeight;
            
            const inset = 4;

            if (Math.random() > 0.1) { // 90% chance of a window
                // 65% chance of being unlit, 35% lit
                if (Math.random() > 0.65) {
                    context.fillStyle = `hsl(45, 100%, ${Math.random() * 15 + 75}%)`; // variations of yellow/white
                } else {
                    context.fillStyle = '#151518'; // Unlit window
                }
                context.fillRect(x + inset, y + inset * 1.5, colWidth - inset * 2, rowHeight - inset * 3);
            }
        }
    }
    return new THREE.CanvasTexture(canvas);
};


type Enemy = {
    id: string;
    health: number;
    maxHealth: number;
    position: THREE.Vector3;
    aiState: 'chasing' | 'wandering';
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
    walkAudioRef: React.RefObject<HTMLAudioElement>;
    enemyWalkAudioRef: React.RefObject<HTMLAudioElement>;
    gameOverAudioRef: React.RefObject<HTMLAudioElement>;
    onCollect: () => void;
    onAttack: () => void;
    onJump: () => void;
    onEnemyDefeated: () => void;
    onEnemyHit: () => void;
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
    minimapRef: React.RefObject<HTMLCanvasElement>;
};

export function GameCanvas({ 
    score, setScore, setGameOver, collectibleCount, walkAudioRef, enemyWalkAudioRef, gameOverAudioRef,
    onCollect, onAttack, onJump, onEnemyDefeated, onEnemyHit, joystickDelta, isAttacking, setIsAttacking,
    isJumping, setIsJumping, playerHealth, setPlayerHealth, maxPlayerHealth, enemies, setEnemies,
    playerHealthBarRef, enemyHealthBarRefs, floatingTextContainerRef, minimapRef
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const gameState = useRef({ score, playerHealth, enemies, isAttacking, isJumping, joystickDelta, maxPlayerHealth });

  const floatingTexts = useRef<FloatingText[]>([]);
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
    scene.background = new THREE.Color(0x101025);
    scene.fog = new THREE.Fog(0x101025, 50, 100);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountNode.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight( 0x4040ff, 0x808080, 0.6 );
    scene.add( hemiLight );
    
    const directionalLight = new THREE.DirectionalLight(0xffd5a1, 2.0);
    directionalLight.position.set(30, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    const d = 65;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.bias = -0.0002;
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    
    const groundTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(128, 128);
    const planeSize = 120;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), new THREE.MeshStandardMaterial({ map: groundTexture, metalness: 0.0, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 });
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
    
    for (let i = 0; i < 70; i++) {
        const width = Math.random() * 7 + 6;
        const height = Math.random() * 30 + 20;
        const depth = Math.random() * 7 + 6;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        
        const windowTexture = createWindowTexture();
        if (!windowTexture) continue;

        windowTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        windowTexture.wrapS = THREE.RepeatWrapping;
        windowTexture.wrapT = THREE.RepeatWrapping;

        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.3 });
        const sideMaterial = new THREE.MeshStandardMaterial({
            map: windowTexture,
            metalness: 0.8,
            roughness: 0.3,
            emissiveMap: windowTexture,
            emissive: 0xffffff,
            emissiveIntensity: 1.8,
        });

        const frontBackMaterial = sideMaterial.clone();
        const frontBackTexture = windowTexture.clone();
        frontBackTexture.repeat.set(Math.round(width / 6), Math.round(height / 24));
        frontBackTexture.needsUpdate = true;
        frontBackMaterial.map = frontBackTexture;
        frontBackMaterial.emissiveMap = frontBackTexture;
        
        const leftRightMaterial = sideMaterial.clone();
        const leftRightTexture = windowTexture.clone();
        leftRightTexture.repeat.set(Math.round(depth / 6), Math.round(height / 24));
        leftRightTexture.needsUpdate = true;
        leftRightMaterial.map = leftRightTexture;
        leftRightMaterial.emissiveMap = leftRightTexture;
        
        const building = new THREE.Mesh(buildingGeometry, [
            leftRightMaterial, // right
            leftRightMaterial, // left
            topMaterial,      // top
            topMaterial,      // bottom
            frontBackMaterial,// front
            frontBackMaterial // back
        ]);
        
        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < 50) {
            building.position.set(
                (Math.random() - 0.5) * (planeSize - width), 
                height / 2, 
                (Math.random() - 0.5) * (planeSize - depth)
            );
            const buildingBB = new THREE.Box3().setFromObject(building);

            let collision = roadBBs.some(rBB => rBB.intersectsBox(buildingBB));
            
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
            const inBuilding = obstacles.some(obs => new THREE.Box3().setFromObject(obs).intersectsBox(treeBB));
            
            if (!onRoad && !inBuilding) {
                validPosition = true;
            }
            attempts++;
        }
        
        if (validPosition) {
            scene.add(tree);
            obstacles.push(tree);
        }
    }
    
    const streetlightMaterial = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.9, roughness: 0.5 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffd580, emissive: 0xffd580, emissiveIntensity: 2 });
    const streetlightPoleGeom = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
    const streetlightArmGeom = new THREE.BoxGeometry(1.5, 0.2, 0.2);
    const streetlightLampGeom = new THREE.SphereGeometry(0.4, 8, 8);

    const createStreetlight = () => {
        const streetlight = new THREE.Group();
        const pole = new THREE.Mesh(streetlightPoleGeom, streetlightMaterial);
        pole.position.y = 3.5;
        streetlight.add(pole);
        
        const arm = new THREE.Mesh(streetlightArmGeom, streetlightMaterial);
        arm.position.set(0.75, 6.8, 0);
        streetlight.add(arm);
        
        const lamp = new THREE.Mesh(streetlightLampGeom, lightMaterial);
        lamp.position.set(1.5, 6.5, 0);
        streetlight.add(lamp);

        const pointLight = new THREE.PointLight(0xffd580, 25, 20, 1.5);
        pointLight.position.set(1.5, 6.2, 0);
        pointLight.castShadow = false; // Performance
        streetlight.add(pointLight);

        return streetlight;
    }

    const streetlightSpacing = 25;
    roadSegments.forEach(seg => {
        const roadLength = seg.length;
        const numLights = Math.floor(roadLength / streetlightSpacing);
        
        for (let i = 0; i < numLights; i++) {
            const progress = (i / (numLights > 1 ? numLights -1 : 1)) - 0.5;
            
            for(let side = -1; side <= 1; side += 2) {
                if (numLights === 1 && progress !== 0 && i > 0) continue;
                
                const light = createStreetlight();
                const offset = (roadWidth / 2) + 1.5;

                if (seg.horizontal) {
                    light.position.set(seg.x + progress * roadLength, 0, seg.z + offset * side);
                    light.rotation.y = side > 0 ? Math.PI : 0;
                } else { // vertical
                    light.position.set(seg.x + offset * side, 0, seg.z + progress * roadLength);
                    light.rotation.y = Math.PI / 2 * -side;
                }
                
                let tooClose = obstacles.some(obs => light.position.distanceTo(obs.position) < 8 && obs.position.y > 1);
                if (!tooClose) {
                     scene.add(light);
                     const poleForCollision = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 8));
                     poleForCollision.position.copy(light.position);
                     poleForCollision.position.y = 3.5;
                     obstacles.push(poleForCollision);
                }
            }
        }
    });

    let obstacleBBs = obstacles.map(obs => new THREE.Box3().setFromObject(obs));

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
        let inBuilding = obstacleBBs.some(obsBB => obsBB.containsPoint(checkPoint));

        if (!onRoad && !inBuilding) {
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
    const collectibleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3.0, toneMapped: false });
    for (let i = 0; i < collectibleCount; i++) {
        const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
        let validPosition = false;
        while (!validPosition) {
            collectible.position.set((Math.random() - 0.5) * (planeSize - 2), 0.75, (Math.random() - 0.5) * (planeSize - 2));
            const collectibleBB = new THREE.Box3().setFromObject(collectible);
            validPosition = !obstacleBBs.some(obsBB => obsBB.intersectsBox(collectibleBB));
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
    
    const cameraPivot = new THREE.Group();
    const cameraTarget = new THREE.Vector3();
    const cameraIdealOffset = new THREE.Vector3(0, 2.5, -4.5);
    const cameraLookat = new THREE.Vector3(0, 1.5, 0);
    scene.add(cameraPivot);

    let isMouseDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
        if(e.button === 0) {
            isMouseDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isMouseDragging) return;

        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        cameraPivot.rotation.y -= deltaX * 0.002;
        const camX = cameraPivot.rotation.x - deltaY * 0.002;
        cameraPivot.rotation.x = THREE.MathUtils.clamp(camX, -0.5, 1.2);

        previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
        if(e.button === 0) {
            isMouseDragging = false;
        }
    };
    
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    const attackEffect = new THREE.Mesh(new THREE.RingGeometry(2.8, 3, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    attackEffect.rotation.x = -Math.PI/2;
    scene.add(attackEffect);
    
    let player: THREE.Group | null = null;
    const playerBB = new THREE.Box3();
    const playerVelocity = new THREE.Vector3();

    type EnemyObject = { 
        id: string;
        mesh: THREE.Group,
        attackCooldown: number;
        stuckTimer: number;
        lastPosition: THREE.Vector3;
    };
    const enemyObjects: EnemyObject[] = [];
    let modelsLoaded = false;

    const createCharacter = (material: THREE.Material) => {
        const character = new THREE.Group();

        // Legs with Knees
        const legPartGeo = new THREE.BoxGeometry(0.25, 0.4, 0.25);

        // Left Leg
        const leftLegGroup = new THREE.Group(); // This is the hip
        leftLegGroup.name = 'leftLegGroup';
        leftLegGroup.position.set(-0.2, 0.8, 0);
        character.add(leftLegGroup);
        
        const upperLeftLeg = new THREE.Mesh(legPartGeo, material);
        upperLeftLeg.castShadow = true;
        upperLeftLeg.position.y = -0.2; // Centered
        leftLegGroup.add(upperLeftLeg);

        const leftKnee = new THREE.Group();
        leftKnee.name = 'leftKnee';
        leftKnee.position.y = -0.4; // Position knee at end of upper leg
        leftLegGroup.add(leftKnee);

        const lowerLeftLeg = new THREE.Mesh(legPartGeo, material);
        lowerLeftLeg.castShadow = true;
        lowerLeftLeg.position.y = -0.2; // Hangs from knee pivot
        leftKnee.add(lowerLeftLeg);
        
        // Right Leg
        const rightLegGroup = new THREE.Group(); // This is the hip
        rightLegGroup.name = 'rightLegGroup';
        rightLegGroup.position.set(0.2, 0.8, 0);
        character.add(rightLegGroup);

        const upperRightLeg = new THREE.Mesh(legPartGeo, material);
        upperRightLeg.castShadow = true;
        upperRightLeg.position.y = -0.2;
        rightLegGroup.add(upperRightLeg);

        const rightKnee = new THREE.Group();
        rightKnee.name = 'rightKnee';
        rightKnee.position.y = -0.4;
        rightLegGroup.add(rightKnee);

        const lowerRightLeg = new THREE.Mesh(legPartGeo, material);
        lowerRightLeg.castShadow = true;
        lowerRightLeg.position.y = -0.2;
        rightKnee.add(lowerRightLeg);


        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.5), material);
        torso.position.y = 1.1;
        torso.castShadow = true;
        character.add(torso);
        
        // Arms with Elbows
        const armPartGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const handGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);


        // Left Arm
        const leftArmGroup = new THREE.Group(); // This is the shoulder
        leftArmGroup.name = 'leftArmGroup';
        leftArmGroup.position.set(-0.55, 1.4, 0);
        character.add(leftArmGroup);
        
        const upperLeftArm = new THREE.Mesh(armPartGeo, material);
        upperLeftArm.castShadow = true;
        upperLeftArm.position.y = -0.2; // Centered, but hangs from y=0 to y=-0.4
        leftArmGroup.add(upperLeftArm);

        const leftElbow = new THREE.Group();
        leftElbow.name = 'leftElbow';
        leftElbow.position.y = -0.4; // Position elbow at end of upper arm, relative to shoulder
        leftArmGroup.add(leftElbow);

        const lowerLeftArm = new THREE.Mesh(armPartGeo, material);
        lowerLeftArm.castShadow = true;
        lowerLeftArm.position.y = -0.2; // Hangs from elbow pivot
        leftElbow.add(lowerLeftArm);

        const leftHand = new THREE.Mesh(handGeo, material);
        leftHand.castShadow = true;
        leftHand.position.y = -0.4; // Position at the end of the lower arm
        leftElbow.add(leftHand);

        // Right Arm
        const rightArmGroup = new THREE.Group(); // This is the shoulder
        rightArmGroup.name = 'rightArmGroup';
        rightArmGroup.position.set(0.55, 1.4, 0);
        character.add(rightArmGroup);

        const upperRightArm = new THREE.Mesh(armPartGeo, material);
        upperRightArm.castShadow = true;
        upperRightArm.position.y = -0.2;
        rightArmGroup.add(upperRightArm);

        const rightElbow = new THREE.Group();
        rightElbow.name = 'rightElbow';
        rightElbow.position.y = -0.4;
        rightArmGroup.add(rightElbow);

        const lowerRightArm = new THREE.Mesh(armPartGeo, material);
        lowerRightArm.castShadow = true;
        lowerRightArm.position.y = -0.2;
        rightElbow.add(lowerRightArm);

        const rightHand = new THREE.Mesh(handGeo, material);
        rightHand.castShadow = true;
        rightHand.position.y = -0.4; // Position at the end of the lower arm
        rightElbow.add(rightHand);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), material);
        head.position.y = 1.7;
        head.castShadow = true;
        character.add(head);
        
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMaterial);
        leftEye.position.set(-0.1, 0.05, 0.28);
        head.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMaterial);
        rightEye.position.set(0.1, 0.05, 0.28);
        head.add(rightEye);
        
        return character;
    }

    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.8, roughness: 0.4 });
    player = createCharacter(playerMaterial);
    player.position.y = 0;
    scene.add(player);
    
    const playerLight = new THREE.PointLight(0xffaa33, 1.2, 18, 1.8);
    playerLight.castShadow = true;
    playerLight.shadow.mapSize.width = 256;
    playerLight.shadow.mapSize.height = 256;
    playerLight.shadow.bias = -0.01;
    player.add(playerLight);
    
    const algojo1Material = new THREE.MeshStandardMaterial({
        color: 0xbb0000,
        metalness: 0.9,
        roughness: 0.4,
        emissive: 0x880000,
        emissiveIntensity: 0.8
    });
    
    const algojo2Material = new THREE.MeshStandardMaterial({
        color: 0x9400D3, // DarkViolet
        metalness: 0.8,
        roughness: 0.6,
        emissive: 0x6A0DAD,
        emissiveIntensity: 0.9
    });

    gameState.current.enemies.forEach(enemyData => {
        if (!enemyData) return;
        
        let material;
        if (enemyData.id === 'algojo1') {
            material = algojo1Material;
        } else if (enemyData.id === 'algojo2') {
            material = algojo2Material;
        } else {
            material = algojo1Material;
        }
        
        const enemyMesh = createCharacter(material);
        enemyMesh.position.copy(enemyData.position);
        enemyMesh.position.y = 0;
        
        if (enemyData.id.startsWith('algojo')) {
            const scale = 4.0;
            enemyMesh.scale.set(scale, scale, scale);
        }

        scene.add(enemyMesh);
        
        enemyObjects.push({
            id: enemyData.id,
            mesh: enemyMesh,
            attackCooldown: 0,
            stuckTimer: 0,
            lastPosition: enemyMesh.position.clone(),
        });
    });
        
    modelsLoaded = true;

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    let attackCooldown = 0;
    
    const drawMinimap = () => {
        const canvas = minimapRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx || !player) return;

        const mapSize = canvas.width;
        const scale = mapSize / planeSize;

        const transformX = (x: number) => (x + planeSize / 2) * scale;
        const transformZ = (z: number) => (z + planeSize / 2) * scale;
        
        // Clear canvas with a slightly transparent background
        ctx.fillStyle = 'rgba(16, 16, 37, 0.85)';
        ctx.fillRect(0, 0, mapSize, mapSize);

        // Draw roads
        ctx.fillStyle = 'rgba(40, 40, 45, 0.9)';
        roadBBs.forEach(bb => {
            const minX = transformX(bb.min.x);
            const minZ = transformZ(bb.min.z);
            const width = (bb.max.x - bb.min.x) * scale;
            const height = (bb.max.z - bb.min.z) * scale;
            ctx.fillRect(minX, minZ, width, height);
        });

        // Draw obstacles (buildings, trees)
        ctx.fillStyle = 'rgba(100, 100, 110, 0.6)';
        obstacleBBs.forEach(bb => {
            // filter out tiny obstacles
            if ((bb.max.x - bb.min.x) < 0.5 && (bb.max.z - bb.min.z) < 0.5) return;
            const minX = transformX(bb.min.x);
            const minZ = transformZ(bb.min.z);
            const width = (bb.max.x - bb.min.x) * scale;
            const height = (bb.max.z - bb.min.z) * scale;
            ctx.fillRect(minX, minZ, width, height);
        });

        // Draw collectibles
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
        ctx.shadowBlur = 4;
        collectibles.forEach(c => {
            ctx.beginPath();
            ctx.arc(transformX(c.position.x), transformZ(c.position.z), 2, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Draw enemies
        enemyObjects.forEach(eo => {
            const enemyData = gameState.current.enemies.find(e => e.id === eo.id);
            if (enemyData && enemyData.health > 0) {
                if (eo.id === 'algojo1') {
                    ctx.fillStyle = 'rgba(255, 80, 80, 1)';
                    ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
                } else if (eo.id === 'algojo2') {
                    ctx.fillStyle = 'rgba(200, 80, 255, 1)';
                    ctx.strokeStyle = 'rgba(148, 0, 211, 1)';
                }
                ctx.lineWidth = 1;
                const enemyX = transformX(eo.mesh.position.x);
                const enemyZ = transformZ(eo.mesh.position.z);
                ctx.beginPath();
                ctx.arc(enemyX, enemyZ, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        });

        // Draw player
        const playerX = transformX(player.position.x);
        const playerZ = transformZ(player.position.z);
        
        ctx.save();
        ctx.translate(playerX, playerZ);
        ctx.rotate(player.rotation.y);

        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 7);
        ctx.lineTo(-5, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    }


    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1); 
        const elapsedTime = clock.getElapsedTime();
        uniforms.time.value = elapsedTime;
        
        if (attackEffect.material.opacity > 0) attackEffect.material.opacity -= delta * 4;

        if (!modelsLoaded || !player) {
            renderer.render(scene, camera);
            return;
        }

        if (gameState.current.playerHealth <= 0) {
            if (player) {
                // death pose or animation
            }
            renderer.render(scene, camera);
            return;
        }

        if (attackCooldown > 0) attackCooldown -= delta;
        if (playerDamageCooldown.current > 0) playerDamageCooldown.current -= delta;
        
        const onGround = player.position.y <= 0;
        const gravity = 30.0;
        if (!onGround) {
            playerVelocity.y -= gravity * delta;
        }
        player.position.y += playerVelocity.y * delta;
        if (player.position.y < 0) {
            player.position.y = 0;
            playerVelocity.y = 0;
        }

        const inputDirection = new THREE.Vector3();
        const joystick = gameState.current.joystickDelta;
        if (joystick.x !== 0 || joystick.z !== 0) {
            inputDirection.set(joystick.x, 0, -joystick.z).normalize();
        } else {
            if (keys['w'] || keys['arrowup']) inputDirection.z = -1;
            if (keys['s'] || keys['arrowdown']) inputDirection.z = 1;
            if (keys['a'] || keys['arrowleft']) inputDirection.x = -1;
            if (keys['d'] || keys['arrowright']) inputDirection.x = 1;
            inputDirection.normalize();
        }
        
        const isMoving = inputDirection.lengthSq() > 0;
        
        if (isMoving) {
            const cameraForward = new THREE.Vector3();
            cameraPivot.getWorldDirection(cameraForward);
            cameraForward.y = 0;
            cameraForward.normalize();

            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(camera.up, cameraForward);
            
            const moveDirection = cameraForward.multiplyScalar(inputDirection.z).add(cameraRight.multiplyScalar(inputDirection.x));
            moveDirection.normalize();

            const targetRotation = new THREE.Quaternion();
            targetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(moveDirection.x, moveDirection.z));
            player.quaternion.slerp(targetRotation, 0.2);
            
            const moveVector = moveDirection.multiplyScalar(5 * delta);
            const tempPlayerPos = player.position.clone().add(moveVector);
            const playerBodyBB = new THREE.Box3().setFromCenterAndSize(tempPlayerPos.clone().setY(tempPlayerPos.y + 1), new THREE.Vector3(0.8, 2, 0.8));

            let collision = obstacleBBs.some(obsBB => obsBB.intersectsBox(playerBodyBB));
            if (!collision) {
                player.position.add(moveVector);
            }
        }
        playerBB.setFromObject(player);
        
        let isTryingToJump = (gameState.current.isJumping || keys[' ']);
        let isTryingToAttack = (gameState.current.isAttacking || keys['f']);
        
        if(gameState.current.isJumping) setIsJumping(false);
        if(gameState.current.isAttacking) setIsAttacking(false);

        if (isTryingToAttack && attackCooldown <= 0) {
            attackCooldown = 0.7;
            onAttack();
            attackEffect.position.copy(player.position);
            attackEffect.material.opacity = 0.8;
            
            const attackRadius = 3;
            const attackDamage = 10;
            const damagedEnemies = new Set<string>();
            enemyObjects.forEach((enemyObj) => {
                const enemyData = gameState.current.enemies.find(e => e.id === enemyObj.id);
                if (enemyObj.mesh.visible && enemyData && enemyData.health > 0 && player.position.distanceTo(enemyObj.mesh.position) < attackRadius) {
                    damagedEnemies.add(enemyData.id);
                }
            });
            if (damagedEnemies.size > 0) {
                setEnemies(prev => prev.map(e => {
                    if (damagedEnemies.has(e.id)) {
                        const enemyObj = enemyObjects.find(eo => eo.id === e.id);
                        const newHealth = Math.max(0, e.health - attackDamage);
                        if (e.health > 0 && newHealth <= 0) onEnemyDefeated();

                        if (enemyObj?.mesh) {
                             const enemyHeight = 2.0 * enemyObj.mesh.scale.y;
                             spawnFloatingText(`-${attackDamage}`, '#ffcc00', enemyObj.mesh.position.clone().add(new THREE.Vector3(Math.random()-0.5, enemyHeight + 1.0, Math.random()-0.5)));
                        }
                        
                        return { ...e, health: newHealth };
                    }
                    return e;
                }));
            }

        }
        
        if (isTryingToJump && onGround) {
            playerVelocity.y = 10;
            onJump();
        }
        
        // Character Animations
        const leftLeg = player.getObjectByName('leftLegGroup');
        const rightLeg = player.getObjectByName('rightLegGroup');
        const leftArm = player.getObjectByName('leftArmGroup');
        const rightArm = player.getObjectByName('rightArmGroup');
        const leftElbow = player.getObjectByName('leftElbow');
        const rightElbow = player.getObjectByName('rightElbow');
        const leftKnee = player.getObjectByName('leftKnee');
        const rightKnee = player.getObjectByName('rightKnee');

        if (leftLeg && rightLeg && leftArm && rightArm && leftElbow && rightElbow && leftKnee && rightKnee) {
            const attackAnimationProgress = attackCooldown > 0.3 ? (1 - (attackCooldown - 0.3) / 0.4) : -1;

            if (attackAnimationProgress >= 0) {
                // Attacking animation
                const swingAngle = Math.sin(attackAnimationProgress * Math.PI); // 0 -> 1 -> 0
                
                const punchShoulderAngle = -swingAngle * 2.5;
                const punchElbowAngle = -swingAngle * 1.8;

                rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, punchShoulderAngle, 0.8);
                rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, punchElbowAngle, 0.8);
                
                // Left arm braces
                leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.2, 0.2); 
                leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, -0.5, 0.2);

            } else if (!onGround) {
                // Jumping animation
                const jumpAngle = Math.PI / 4;
                leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -jumpAngle, 0.1);
                rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -jumpAngle * 0.8, 0.1);
                leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, -jumpAngle * 1.5, 0.1);
                rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, -jumpAngle * 1.5, 0.1);

                leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, jumpAngle, 0.1);
                rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, jumpAngle * 0.5, 0.1);
                leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, jumpAngle * 1.5, 0.1);
                rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, jumpAngle * 1.5, 0.1);

            } else if (isMoving) {
                // Walking animation
                const walkCycle = elapsedTime * 8;
                const walkAmplitude = 1.0;
                
                const leftLegAngle = Math.sin(walkCycle) * walkAmplitude;
                const rightLegAngle = Math.sin(walkCycle + Math.PI) * walkAmplitude;
                leftLeg.rotation.x = leftLegAngle;
                rightLeg.rotation.x = rightLegAngle;

                leftKnee.rotation.x = Math.max(0, leftLegAngle) * 1.5;
                rightKnee.rotation.x = Math.max(0, rightLegAngle) * 1.5;
                
                const leftArmAngle = Math.sin(walkCycle + Math.PI) * walkAmplitude * 0.7;
                const rightArmAngle = Math.sin(walkCycle) * walkAmplitude * 0.7;
                leftArm.rotation.x = leftArmAngle;
                rightArm.rotation.x = rightArmAngle;

                // Bend elbows when walking
                const elbowBend = -Math.max(0, -leftArmAngle) * 1.5; // Bend forward
                leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, elbowBend, 0.15);
                const rightElbowBend = -Math.max(0, -rightArmAngle) * 1.5;
                rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, rightElbowBend, 0.15);

            } else {
                // Idle animation
                leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.15);
                rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.15);
                leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, 0, 0.15);
                rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, 0, 0.15);

                leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.15);
                rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.15);
                leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, 0, 0.15);
                rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, 0, 0.15);
            }
        }


        player.position.x = THREE.MathUtils.clamp(player.position.x, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -planeSize/2 + 0.5, planeSize/2 - 0.5);
        
        let isAnyEnemyWalkingNear = false;

        enemyObjects.forEach((enemyObj) => {
            const enemyData = gameState.current.enemies.find(e => e.id === enemyObj.id);
            if (!enemyData || enemyData.health <= 0) {
                if (enemyObj.mesh.visible) {
                    enemyObj.mesh.visible = false;
                }
                return;
            }
            if (enemyObj.attackCooldown > 0) enemyObj.attackCooldown -= delta;

            enemyData.aiTimer -= delta;
            const distanceToPlayer = enemyObj.mesh.position.distanceTo(player.position);
            let moving = false;

            if (enemyData.aiState === 'wandering' && distanceToPlayer < 25) {
                enemyData.aiState = 'chasing';
            } else if (enemyData.aiState === 'chasing' && distanceToPlayer > 35) {
                enemyData.aiState = 'wandering';
                enemyData.aiTimer = 0;
            }
            
            const isEnemyAttacking = enemyObj.attackCooldown > 1.0;

            if (distanceToPlayer <= 2.5 && enemyObj.attackCooldown <= 0 && playerDamageCooldown.current <= 0) {
                const directionToTarget = new THREE.Vector3().subVectors(player.position, enemyObj.mesh.position).normalize();
                enemyObj.mesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
                
                enemyObj.attackCooldown = 1.5;
                playerDamageCooldown.current = 1.2;
                
                setTimeout(() => { // Damage dealt mid-animation
                    if (gameState.current.playerHealth > 0 && player.position.distanceTo(enemyObj.mesh.position) < 2.8) {
                        const damage = 15;
                        setPlayerHealth(h => {
                            const newHealth = Math.max(0, h - damage);
                            if (h > 0 && newHealth <= 0) {
                                if(gameOverAudioRef.current) gameOverAudioRef.current.play().catch(e => {});
                                setGameOver();
                            }
                            return newHealth;
                        });
                        spawnFloatingText(`-${damage}`, '#ff4400', player.position.clone().add(new THREE.Vector3(Math.random()-0.5, 2.5, Math.random()-0.5)));
                        onEnemyHit();
                    }
                }, 300);

            } else if (enemyObj.attackCooldown <= 0) {
                let currentTarget = new THREE.Vector3();
                if (enemyData.aiState === 'chasing') {
                    currentTarget.copy(player.position);
                } else { 
                    if (enemyData.aiTimer <= 0 || enemyObj.mesh.position.distanceTo(enemyData.targetPosition) < 2) {
                        const newTarget = new THREE.Vector3(
                            (Math.random() - 0.5) * (planeSize - 20), 0.8, (Math.random() - 0.5) * (planeSize - 20)
                        );
                        enemyData.targetPosition.copy(newTarget);
                        enemyData.aiTimer = 5 + Math.random() * 5;
                    }
                    currentTarget.copy(enemyData.targetPosition);
                }

                const directionToTarget = new THREE.Vector3().subVectors(currentTarget, enemyObj.mesh.position);
                if (directionToTarget.length() > 1.5) {
                    directionToTarget.y = 0;
                    directionToTarget.normalize();
                    
                    const enemySpeed = (enemyData.aiState === 'chasing' ? 3.2 : 1.8) * delta;
                    const nextPos = enemyObj.mesh.position.clone().add(directionToTarget.clone().multiplyScalar(enemySpeed));
                    
                    const enemyScale = enemyObj.mesh.scale.y;
                    const enemyHeight = 2.0 * enemyScale;
                    const enemyWidth = 1.0 * enemyScale;
                    const enemyBodyBB = new THREE.Box3().setFromCenterAndSize(
                        nextPos.clone().setY(enemyHeight / 2), 
                        new THREE.Vector3(enemyWidth, enemyHeight, enemyWidth)
                    );
                    
                    if (!obstacleBBs.some(obsBB => obsBB.intersectsBox(enemyBodyBB))) {
                        enemyObj.mesh.position.add(directionToTarget.clone().multiplyScalar(enemySpeed));
                        moving = true;
                    } else if (enemyData.aiState === 'chasing') {
                       enemyData.aiState = 'wandering';
                       enemyData.aiTimer = 0; 
                    }
                    enemyObj.mesh.rotation.y = Math.atan2(directionToTarget.x, directionToTarget.z);
                }

                if (enemyObj.mesh.position.distanceTo(enemyObj.lastPosition) < 0.01 * delta * 60) {
                    enemyObj.stuckTimer += delta;
                } else {
                    enemyObj.stuckTimer = 0;
                    enemyObj.lastPosition.copy(enemyObj.mesh.position);
                }
                if (enemyObj.stuckTimer > 0.5) { 
                    enemyData.aiState = 'wandering';
                    enemyData.aiTimer = 0;
                    enemyObj.stuckTimer = 0;
                }
            }

            if (moving && distanceToPlayer < 40) {
                isAnyEnemyWalkingNear = true;
            }

            const eLeftLeg = enemyObj.mesh.getObjectByName('leftLegGroup');
            const eRightLeg = enemyObj.mesh.getObjectByName('rightLegGroup');
            const eLeftArm = enemyObj.mesh.getObjectByName('leftArmGroup');
            const eRightArm = enemyObj.mesh.getObjectByName('rightArmGroup');
            const eLeftElbow = enemyObj.mesh.getObjectByName('leftElbow');
            const eRightElbow = enemyObj.mesh.getObjectByName('rightElbow');
            const eLeftKnee = enemyObj.mesh.getObjectByName('leftKnee');
            const eRightKnee = enemyObj.mesh.getObjectByName('rightKnee');

            if(eLeftLeg && eRightLeg && eLeftArm && eRightArm && eLeftElbow && eRightElbow && eLeftKnee && eRightKnee) {
                if(isEnemyAttacking) {
                    const attackProgress = 1 - ((enemyObj.attackCooldown - 1.0) / 0.5);
                    const swingAngle = Math.sin(attackProgress * Math.PI); // 0 -> 1 -> 0
                    
                    const punchShoulderAngle = -swingAngle * 2.0;
                    const punchElbowAngle = -swingAngle * 1.5;

                    eRightArm.rotation.x = punchShoulderAngle;
                    eRightElbow.rotation.x = punchElbowAngle;
                    
                    eLeftArm.rotation.x = THREE.MathUtils.lerp(eLeftArm.rotation.x, 0, 0.15);
                    eLeftElbow.rotation.x = THREE.MathUtils.lerp(eLeftElbow.rotation.x, 0, 0.15);
                } else if (moving) {
                    const walkCycle = elapsedTime * 6;
                    const walkAmplitude = 1.0;
                    const leftLegAngle = Math.sin(walkCycle) * walkAmplitude;
                    const rightLegAngle = Math.sin(walkCycle + Math.PI) * walkAmplitude;
                    eLeftLeg.rotation.x = leftLegAngle;
                    eRightLeg.rotation.x = rightLegAngle;

                    eLeftKnee.rotation.x = Math.max(0, leftLegAngle) * 1.5;
                    eRightKnee.rotation.x = Math.max(0, rightLegAngle) * 1.5;

                    const leftArmAngle = Math.sin(walkCycle + Math.PI) * walkAmplitude * 0.7;
                    const rightArmAngle = Math.sin(walkCycle) * walkAmplitude * 0.7;
                    eLeftArm.rotation.x = leftArmAngle;
                    eRightArm.rotation.x = rightArmAngle;

                    const elbowBend = -Math.max(0, -leftArmAngle) * 1.5;
                    eLeftElbow.rotation.x = elbowBend;
                    const rightElbowBend = -Math.max(0, -rightArmAngle) * 1.5;
                    eRightElbow.rotation.x = rightElbowBend;
                } else {
                    eLeftLeg.rotation.x = THREE.MathUtils.lerp(eLeftLeg.rotation.x, 0, 0.15);
                    eRightLeg.rotation.x = THREE.MathUtils.lerp(eRightLeg.rotation.x, 0, 0.15);
                    eLeftKnee.rotation.x = THREE.MathUtils.lerp(eLeftKnee.rotation.x, 0, 0.15);
                    eRightKnee.rotation.x = THREE.MathUtils.lerp(eRightKnee.rotation.x, 0, 0.15);

                    eLeftArm.rotation.x = THREE.MathUtils.lerp(eLeftArm.rotation.x, 0, 0.15);
                    eRightArm.rotation.x = THREE.MathUtils.lerp(eRightArm.rotation.x, 0, 0.15);
                    eLeftElbow.rotation.x = THREE.MathUtils.lerp(eLeftElbow.rotation.x, 0, 0.15);
                    eRightElbow.rotation.x = THREE.MathUtils.lerp(eRightElbow.rotation.x, 0, 0.15);
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
        
        if (isMoving && onGround) {
            if (walkAudioRef.current && walkAudioRef.current.paused) {
                walkAudioRef.current.play().catch(e => {});
            }
        } else {
            if (walkAudioRef.current && !walkAudioRef.current.paused) {
                walkAudioRef.current.pause();
            }
        }

        if (isAnyEnemyWalkingNear) {
            if (enemyWalkAudioRef.current && enemyWalkAudioRef.current.paused) {
                enemyWalkAudioRef.current.play().catch(e => {});
            }
        } else {
             if (enemyWalkAudioRef.current && !enemyWalkAudioRef.current.paused) {
                enemyWalkAudioRef.current.pause();
            }
        }
        
        cameraPivot.position.copy(player.position);
        
        const idealCameraOffsetRotated = cameraIdealOffset.clone().applyQuaternion(cameraPivot.quaternion);
        const idealCameraPosition = player.position.clone().add(idealCameraOffsetRotated);

        const lookAtPoint = player.position.clone().add(cameraLookat);
        const rayDirection = idealCameraPosition.clone().sub(lookAtPoint).normalize();
        const rayLength = idealCameraPosition.distanceTo(lookAtPoint);
        raycaster.set(lookAtPoint, rayDirection);
        const intersections = raycaster.intersectObjects(obstacles, false);
        
        let finalCameraPosition = idealCameraPosition;
        if (intersections.length > 0 && intersections[0].distance < rayLength) {
             finalCameraPosition = lookAtPoint.clone().add(rayDirection.multiplyScalar(intersections[0].distance - 0.2));
        }
        
        const dampFactor = 8.0;
        camera.position.lerp(finalCameraPosition, dampFactor * delta);

        const targetLookat = lookAtPoint;
        cameraTarget.lerp(targetLookat, dampFactor * delta);
        camera.lookAt(cameraTarget);

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

        if(player) {
            updateHealthBarPosition(player, playerHealthBarRef, 2.2);
        }
        enemyObjects.forEach((em, i) => {
            if (em.mesh) {
                const enemyHeight = 2.0 * em.mesh.scale.y;
                updateHealthBarPosition(em.mesh, { current: enemyHealthBarRefs.current[i] }, enemyHeight + 0.5);
            }
        });
        
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
        drawMinimap();
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
        
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (mountNode && renderer.domElement) {
            mountNode.removeChild(renderer.domElement);
        }
        cancelAnimationFrame(animationFrameId);
        
        if (walkAudioRef.current) walkAudioRef.current.pause();
        if (enemyWalkAudioRef.current) enemyWalkAudioRef.current.pause();

        if (floatingTextContainerRef.current) {
          floatingTextContainerRef.current.innerHTML = '';
        }
        floatingTexts.current = [];

        scene.traverse(object => {
             if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh || object instanceof THREE.LineSegments) {
                object.geometry?.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    if (material.map) material.map.dispose();
                    if (material.emissiveMap) material.emissiveMap.dispose();
                    material.dispose();
                });
            }
        });
        
        [groundTexture, grassTexture, trunkMaterial, leavesMaterial, roadMaterial, collectibleMaterial, streetlightMaterial, lightMaterial, playerMaterial, algojo1Material, algojo2Material].forEach(t => t?.dispose?.());
        [grassBladeGeometry, collectibleGeometry, streetlightPoleGeom, streetlightArmGeom, streetlightLampGeom].forEach(g => g?.dispose?.());
        
        renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
}
