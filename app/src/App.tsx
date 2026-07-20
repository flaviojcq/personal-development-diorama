import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture, Html, useGLTF, Center, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import lightParquetUrl from './assets/light_parquet.jpg';
import fiddleLeafUrl from '../public/models/fiddle_leaf_plant.glb?url';
import housePlantUrl from '../public/models/house_plant.glb?url';
import umbrellapalmUrl from '../public/models/umbrella_palm.glb?url';
import birdsOfParadiseUrl from '../public/models/birds_of_paradise.glb?url';
import wassilyChairUrl from '../public/models/wassily_chair.glb?url';
import monsterraUrl from '../public/models/monsterra.glb?url';
import drawerUrl from '../public/models/drawer.glb?url';
import recordPLayerUrl from '../public/models/record_player.glb?url';
import orchidUrl from '../public/models/orchid.glb?url';
import pianoUrl from '../public/models/piano.glb?url';
import acousticGuitarUrl from '../public/models/acoustic_guitar.glb?url';
import speakerUrl from '../public/models/speaker.glb?url';
import bedUrl from '../public/models/bed.glb?url';
import carpetUrl from '../public/models/persian_carpet.glb?url';
import catUrl from '../public/models/an_animated_cat.glb?url';
import dogUrl from '../public/models/bullcat.glb?url';
import ps5GamingSetupUrl from '../public/models/ps5_gaming_setup.glb?url';
import './index.css';

// --- Types & Constants ---
type ZoneType = 'none' | 'me' | 'past' | 'present' | 'future';

const ZONES = [
  { id: 'me', type: 'circle', x: 0, z: 0, size: 6.0, title: 'ME (Central Me)', text: "The starting point and central axis. Choose your path to explore your narrative.", theme: 'theme-me' },
  { id: 'past', type: 'square', x: -20, z: 0, size: 7.0, title: 'Who I Was', text: "Childhood drawings, iconic toys, and a warm, safe atmosphere.", theme: 'theme-past' },
  { id: 'present', type: 'square', x: -20, z: -20, size: 7.0, title: 'Who I Am', text: "A modern studio defining your current identity: sneakers, synth setup, and gaming.", theme: 'theme-present' },
  { id: 'future', type: 'square', x: 0, z: -20, size: 7.0, title: 'Who I Will Be', text: "Future aspirations and growth: vertical gardens, coffee mastery, and acoustic peace.", theme: 'theme-future' },
];

const BUILD_AREAS = [
  { xMin: -27, xMax: -13, zMin: -7, zMax: 7 }, // Past
  { xMin: -27, xMax: -13, zMin: -27, zMax: -13 }, // Present
  { xMin: -7, xMax: 7, zMin: -27, zMax: -13 }, // Future
  { xMin: -14, xMax: -3, zMin: -2, zMax: 2 }, // Cor Past
  { xMin: -2, xMax: 2, zMin: -14, zMax: -3 }, // Cor Future
];

// Define obstacles to restrict movement
export const OBSTACLES = [
  // Past Room
  { id: 'past_toy_shelf', x: -20, y: 1, z: -6.5, width: 4, height: 2, depth: 1 },
  { id: 'past_drawings_wall', x: -26.5, y: 1.5, z: 0, width: 1, height: 3, depth: 4 },
  { id: 'past_play_table', x: -20, y: 0.5, z: 2, width: 3, height: 1, depth: 3 },

  // Present Room (-20, -20)
  { id: 'present_tv_stand', x: -26.5, y: 0.5, z: -20, width: 1, height: 1, depth: 4 },
  { id: 'present_synth_desk', x: -20, y: 0.8, z: -26.5, width: 4, height: 1, depth: 1 },
  { id: 'present_sneaker_wall', x: -13.5, y: 1.5, z: -20, width: 1, height: 3, depth: 5 },

  // Future Room (0, -20)
  { id: 'future_plant_wall', x: 0, y: 1.5, z: -26.5, width: 4, height: 3, depth: 1 },
  { id: 'future_coffee_bar', x: 6.5, y: 1, z: -20, width: 1, height: 2, depth: 4 },
];

function inDiagonalCorridor(x: number, z: number) {
  const width = 2.0; // half-width
  const dist = Math.abs(x - z) / Math.SQRT2;
  const along = x + z;
  return dist <= width + 0.05 && along <= -4 && along >= -32;
}

function pointInAnyArea(x: number, z: number) {
  const eps = 0.001; // Tiny tolerance for floating point imprecision
  if (Math.sqrt(x * x + z * z) <= 6.0 + eps) {
    return true; // Circular Me Room
  }
  for (let area of BUILD_AREAS) {
    if (x >= area.xMin - eps && x <= area.xMax + eps && z >= area.zMin - eps && z <= area.zMax + eps) {
      return true;
    }
  }
  return inDiagonalCorridor(x, z);
}

function isValidPosition(x: number, z: number) {
  const margin = 0.4; // exact half-width of the character

  const insideFloor = pointInAnyArea(x - margin, z - margin) &&
    pointInAnyArea(x + margin, z - margin) &&
    pointInAnyArea(x - margin, z + margin) &&
    pointInAnyArea(x + margin, z + margin);

  if (!insideFloor) return false;

  const pMinX = x - margin;
  const pMaxX = x + margin;
  const pMinZ = z - margin;
  const pMaxZ = z + margin;

  for (let obs of OBSTACLES) {
    const oMinX = obs.x - (obs.width / 2);
    const oMaxX = obs.x + (obs.width / 2);
    const oMinZ = obs.z - (obs.depth / 2);
    const oMaxZ = obs.z + (obs.depth / 2);

    if (pMinX < oMaxX && pMaxX > oMinX && pMinZ < oMaxZ && pMaxZ > oMinZ) {
      return false;
    }
  }

  return true;
}

// --- Keyboard Hook ---
function useKeyboard() {
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key]: true }));
    const up = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key]: false }));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

// --- 3D Components ---

// Block helper for creating pixel-art style furniture
function Block({ position, size, color }: { position: [number, number, number], size: [number, number, number], color: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function ClickableBlock({ position, size, color, text }: { position: [number, number, number], size: [number, number, number], color: string, text: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Écouter les clics sur les autres blocs pour se fermer automatiquement
  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) {
        setClicked(false);
      }
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    if (willBeClicked) {
      window.dispatchEvent(new CustomEvent('block-clicked', { detail: text }));
    } else {
      window.dispatchEvent(new CustomEvent('block-clicked', { detail: null }));
    }
  };

  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Animation de flottement au survol et pulsation lumineuse
  useFrame((state) => {
    if (!meshRef.current) return;

    // Hauteur de base
    let targetY = position[1];

    // Ajout d'un petit saut/flottement au survol
    if (hovered) {
      targetY += Math.sin(state.clock.elapsedTime * 6) * 0.15 + 0.1;
    }

    // Interpolation fluide vers la position cible
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.2);

    // Ajustement de la lumière (sans pulsation)
    if (materialRef.current) {
      const targetGlow = clicked ? 1.0 : (hovered ? 0.5 : 0.25);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetGlow, 0.15);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <boxGeometry args={size} />

      {/* Matériau avec l'effet emissive ajusté dynamiquement */}
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
      />

      {/* Lumière ambiante autour de l'objet qui augmente au clic */}
      <pointLight distance={3} intensity={clicked ? 1.0 : (hovered ? 0.6 : 0.3)} color={color} />

      {/* Texte au clic */}
      {clicked && (
        <Html position={[0, size[1] / 2 + 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="clickable-text">
            {text}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ParquetFloorMaterial({ size }: { size: [number, number] }) {
  const texture = useTexture(lightParquetUrl);

  const clonedTexture = useMemo(() => {
    const t = texture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    // On met à (1, 1) pour que la texture s'étire sur toute la pièce sans se répéter
    t.repeat.set(1, 1);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [texture, size]);

  return <meshStandardMaterial map={clonedTexture} color="#ffffff" />;
}

function FiddleLeafPlant({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(fiddleLeafUrl);

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} position={position} scale={0.5} />;
}

function HousePlant({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(housePlantUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} scale={0.5} />;
}

function UmbrellaPalm({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(umbrellapalmUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} scale={0.5} />;
}

function BirdsOfParadise({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(birdsOfParadiseUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} scale={0.8} />;
}

function WassilyChair({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(wassilyChairUrl);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const text = "My favorite reading chair";

  // Se ferme si un autre objet est cliqué
  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
  };

  // Préparation des matériaux pour qu'ils puissent briller (glow)
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Cloner le matériau pour ne modifier que cette chaise
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#fef08a"); // Couleur dorée du halo
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  // Animation de flottement et de surbrillance
  useFrame((state) => {
    if (!groupRef.current) return;

    // Flottement
    let targetY = position[1];
    if (hovered) {
      targetY += Math.sin(state.clock.elapsedTime * 6) * 0.08 + 0.06;
    }
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.2);

    // Surbrillance douce de la chaise (glow sans pulsation)
    const targetGlow = clicked ? 0.6 : (hovered ? 0.3 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow, 0.15);
        }
      }
    });
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <primitive object={scene} scale={0.08} />

      {/* Lumière d'ambiance douce sur le sol autour de la chaise */}
      <pointLight position={[0, 0.5, 0]} distance={5} intensity={clicked ? 1 : (hovered ? 0.5 : 0)} color="#fef08a" />

      {/* Texte au clic */}
      {clicked && (
        <Html position={[0, 3, 0]} center zIndexRange={[100, 0]}>
          <div className="clickable-text">{text}</div>
        </Html>
      )}
    </group>
  );
}

function Monsterra({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(monsterraUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.7} />;
}

function Drawer({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(drawerUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={1.2} />;
}

function RecordPlayer({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(recordPLayerUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.001} />;
}

function Orchid({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(orchidUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.15} />;
}

function Piano({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(pianoUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return (
    <group position={position} rotation={rotation}>
      <Center bottom>
        <primitive object={scene} scale={0.00003} />
      </Center>
    </group>
  );
}

function AcousticGuitar({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(acousticGuitarUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.085} />;
}

function Bed({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(bedUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return (
    <group position={position} rotation={rotation}>
      <Center bottom>
        <primitive object={scene} scale={3.5} />
      </Center>
    </group>
  );
}

function Speaker({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(speakerUrl);
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return clone;
  }, [scene]);
  return <primitive object={clonedScene} position={position} rotation={rotation} scale={2} />;
}

function Carpet({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(carpetUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={2.6} />;
}

function Cat({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(catUrl);
  const { actions } = useAnimations(animations, groupRef);

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);

  useEffect(() => {
    // Play first available animation
    const firstAction = Object.values(actions)[0];
    if (firstAction) {
      firstAction.reset().play();
    }
  }, [actions]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={scene} scale={0.07} />
    </group>
  );
}

function Dog({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(dogUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={2.2} />;
}

function PS5GamingSetup({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(ps5GamingSetupUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.6} />;
}

function Room({ position, size, floorColor = "#c29469", wallColor = "#ffffff", hasWalls = false, isParquet = false, shape = 'square', yOffset = 0 }: { position: [number, number, number], size: [number, number], floorColor?: string, wallColor?: string, hasWalls?: boolean, isParquet?: boolean, shape?: 'square' | 'circle', yOffset?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.25 + yOffset, 0]} receiveShadow>
        {shape === 'circle' ? (
          <cylinderGeometry args={[size[0] / 2, size[0] / 2, 0.5, 64]} />
        ) : (
          <boxGeometry args={[size[0], 0.5, size[1]]} />
        )}
        {isParquet ? (
          <Suspense fallback={<meshStandardMaterial color="#2d2d2d" />}>
            <ParquetFloorMaterial size={size} />
          </Suspense>
        ) : (
          <meshStandardMaterial color={floorColor} />
        )}
      </mesh>

      {hasWalls && (
        <>
          {/* Back-Left Wall (z-axis) */}
          <mesh position={[-size[0] / 2 - 0.25, 1.75, -0.25]} receiveShadow>
            <boxGeometry args={[0.5, 4.5, size[1] + 0.5]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>

          {/* Back-Right Wall (x-axis) */}
          <mesh position={[-0.25, 1.75, -size[1] / 2 - 0.25]} receiveShadow>
            <boxGeometry args={[size[0] + 0.5, 4.5, 0.5]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </>
      )}
    </group>
  );
}

// --- Thematic Rooms ---

function PastRoom() {
  return (
    <group position={[-20, 0, 0]}>
      {/* Light for warm atmosphere */}
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#fcd34d" distance={15} castShadow />

      {/* Toy Shelf (Top Wall) */}
      <Block position={[0, 1, -6.5]} size={[4, 2, 1]} color="#8b5cf6" />
      {/* Toys on shelf */}
      <ClickableBlock position={[-1, 2.2, -6.5]} size={[0.4, 0.4, 0.4]} color="#ef4444" text="My first fire truck" />
      <ClickableBlock position={[0, 2.2, -6.5]} size={[0.8, 0.4, 0.4]} color="#eab308" text="Wooden blocks" />
      <ClickableBlock position={[1, 2.3, -6.5]} size={[0.6, 0.6, 0.6]} color="#3b82f6" text="Action figure" />

      {/* Drawings Wall (Left Wall) */}
      <Block position={[-6.5, 1.5, 0]} size={[1, 3, 4]} color="#fdf8f6" />
      <Block position={[-6.4, 1.5, 0]} size={[0.1, 0.8, 1]} color="#f43f5e" />
      <Block position={[-6.4, 2, -1]} size={[0.1, 0.6, 0.8]} color="#10b981" />

      {/* Play Table */}
      <Block position={[0, 0.5, 2]} size={[3, 1, 3]} color="#fb923c" />
      <Block position={[0, 1.1, 2]} size={[1.5, 0.2, 1.5]} color="#22c55e" /> {/* Playmat/Board */}
    </group>
  );
}

function PresentRoom() {
  return (
    <group position={[-20, 0, -20]}>
      {/* Piano (Top Wall) */}
      <Suspense fallback={<Block position={[3, 1, -6.5]} size={[2, 2, 1]} color="#1e1e1e" />}>
        <Piano position={[-5.8, 3, 0]} rotation={[0, -2 * Math.PI / 4.3, 0]} />
      </Suspense>

      {/* Acoustic Guitar (Left Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <AcousticGuitar position={[-6.5, 0, 4]} rotation={[0, Math.PI / 4, 0]} />
      </Suspense>

      {/* Bed (Right Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <Bed position={[4, 3.4, -3.2]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* PS5 Gaming Setup (Left Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <PS5GamingSetup position={[-3, 1.8, -7.5]} rotation={[0, 0, 0]} />
      </Suspense>
    </group>
  );
}

function FutureRoom() {
  return (
    <group position={[0, 0, -20]}>
      {/* Fiddle Leaf Plant - centre de la pièce */}
      <Suspense fallback={<Block position={[0, 1, 0]} size={[1, 2, 1]} color="#16a34a" />}>
        <FiddleLeafPlant position={[-6, 0, -6]} />
      </Suspense>

      {/* House Plant - coin gauche */}
      <Suspense fallback={<Block position={[-4, 1, 2]} size={[0.8, 1.5, 0.8]} color="#22c55e" />}>
        <HousePlant position={[-6, 0, 6]} />
      </Suspense>

      {/* Umbrella Palm - coin droite */}
      <Suspense fallback={<Block position={[4, 1, 2]} size={[1, 2, 1]} color="#4ade80" />}>
        <UmbrellaPalm position={[6.5, 0, -6]} />
      </Suspense>

      {/* Birds of Paradise - coin avant gauche */}
      <Suspense fallback={<Block position={[-4, 1, -2]} size={[1, 2, 1]} color="#84cc16" />}>
        <BirdsOfParadise position={[-1, 0, -6]} />
      </Suspense>

      {/* Monsterra - coin avant gauche */}
      <Suspense fallback={<Block position={[-4, 1, -2]} size={[1, 2, 1]} color="#84cc16" />}>
        <Monsterra position={[-4.5, 0, -6]} rotation={[0, -Math.PI / 2, 0]} />
      </Suspense>

      {/* Wassily Chair */}
      <Suspense fallback={<Block position={[0, 1, 3]} size={[1.5, 1.5, 1.5]} color="#94a3b8" />}>
        <WassilyChair position={[0, 0, -4.5]} />
      </Suspense>

      {/* Drawer */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#174282ff" />}>
        <Drawer position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      {/* Record Player */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#505864ff" />}>
        <RecordPlayer position={[-4.45, 1.6, 1.3]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* Orchid */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Orchid position={[-5.85, 1.7, 2]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      {/* Speaker */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Speaker position={[-6.2, 0, -3]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      {/* Speaker */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Speaker position={[-6.2, 0, 3]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      {/* Carpet */}
      <Suspense fallback={<Block position={[-4.5, 0, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Carpet position={[0, 0.1, 0]} rotation={[0, 0, 0]} />
      </Suspense>

      {/* Cat */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Cat position={[3, 0.2, -2]} rotation={[0, Math.PI / 8, 0]} />
      </Suspense>

      {/* Dog */}
      <Suspense fallback={<Block position={[4, 1, -4.5]} size={[1.5, 2, 1]} color="#ec75d8ff" />}>
        <Dog position={[-3, 0.8, -2]} rotation={[0, -Math.PI / 8, 0]} />
      </Suspense>
    </group>
  );
}

function Apartment() {
  return (
    <group>
      {/* Floors */}
      <Room position={[0, 0, 0]} size={[12, 12]} floorColor="#e5e5e5" shape="circle" /> {/* Me Room (Neutral) */}
      <Room position={[-20, 0, 0]} size={[14, 14]} floorColor="#fed7aa" hasWalls={true} /> {/* Past (Warm) */}
      <Room position={[-20, 0, -20]} size={[14, 14]} floorColor="#94a3b8" hasWalls={true} /> {/* Present (Modern) */}
      <Room position={[0, 0, -20]} size={[14, 14]} hasWalls={true} isParquet={true} /> {/* Future (Nature/Warm Parquet) */}

      {/* Corridors */}
      <Room position={[-8.5, 0, 0]} size={[9, 4]} floorColor="#e5e5e5" yOffset={-0.001} />
      <Room position={[0, 0, -8.5]} size={[4, 9]} floorColor="#e5e5e5" yOffset={-0.001} />

      {/* Diagonal Corridor to Present */}
      <group position={[-8.5, 0, -8.5]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.251, 0]} receiveShadow>
          <boxGeometry args={[4, 0.5, 20]} />
          <meshStandardMaterial color="#e5e5e5" />
        </mesh>
      </group>

      {/* Thematic Content */}
      <PastRoom />
      <PresentRoom />
      <FutureRoom />
    </group>
  );
}

function Player({ setZone }: { setZone: (z: ZoneType) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const keys = useKeyboard();
  const speed = 8;
  const { camera } = useThree();
  const camOffset = new THREE.Vector3(15, 15, 15);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    let dx = 0;
    let dz = 0;
    if (keys['w'] || keys['ArrowUp']) { dx -= 1; dz -= 1; }
    if (keys['s'] || keys['ArrowDown']) { dx += 1; dz += 1; }
    if (keys['a'] || keys['ArrowLeft']) { dx -= 1; dz += 1; }
    if (keys['d'] || keys['ArrowRight']) { dx += 1; dz -= 1; }

    if (dx !== 0 && dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx /= len;
      dz /= len;
    }

    const moveX = dx * speed * delta;
    const moveZ = dz * speed * delta;

    if (moveX !== 0 || moveZ !== 0) {
      if (isValidPosition(meshRef.current.position.x + moveX, meshRef.current.position.z)) {
        meshRef.current.position.x += moveX;
      }
      if (isValidPosition(meshRef.current.position.x, meshRef.current.position.z + moveZ)) {
        meshRef.current.position.z += moveZ;
      }

      let activeZone: ZoneType = 'none';
      for (const zone of ZONES) {
        if (zone.type === 'circle') {
          const dist = Math.sqrt(
            Math.pow(meshRef.current.position.x - zone.x, 2) +
            Math.pow(meshRef.current.position.z - zone.z, 2)
          );
          if (dist <= zone.size) {
            activeZone = zone.id as ZoneType;
            break;
          }
        } else if (zone.type === 'square') {
          const dx = Math.abs(meshRef.current.position.x - zone.x);
          const dz = Math.abs(meshRef.current.position.z - zone.z);
          if (dx <= zone.size && dz <= zone.size) {
            activeZone = zone.id as ZoneType;
            break;
          }
        }
      }
      setZone(activeZone);
    }

    camera.position.set(
      meshRef.current.position.x + camOffset.x,
      camOffset.y,
      meshRef.current.position.z + camOffset.z
    );
    camera.lookAt(meshRef.current.position);
  });

  return (
    <mesh ref={meshRef} position={[0, 0.8, 0]} castShadow>
      <boxGeometry args={[0.8, 1.6, 0.8]} />
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

// --- Main App Component ---
function App() {
  const [zone, setZone] = useState<ZoneType>('none');
  const activeZoneData = ZONES.find(z => z.id === zone);

  return (
    <>
      <div className="instructions">
        Use the <b>Arrow keys</b> or <b>WASD</b> to move around.<br />
        Visit the rooms to discover the story.
      </div>

      <div className={`ui-layer ${zone === 'none' ? 'hidden' : ''}`}>
        <div className={`dialog-box ${activeZoneData?.theme || ''}`}>
          <h2>{activeZoneData?.title}</h2>
          <p>{activeZoneData?.text}</p>
        </div>
      </div>

      <Canvas shadows gl={{ antialias: false }} dpr={0.5}>
        <OrthographicCamera makeDefault position={[15, 15, 15]} zoom={40} />
        {/* Lower ambient light for better shadow contrast */}
        <ambientLight intensity={0.3} color="#ffffff" />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />

        <Apartment />
        <Player setZone={setZone} />
      </Canvas>
    </>
  );
}

export default App;
