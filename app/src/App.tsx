import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Edges } from '@react-three/drei';
import * as THREE from 'three';
import './index.css';

// --- Types & Constants ---
type ZoneType = 'none' | 'me' | 'past' | 'present' | 'future';

const ZONES = [
  { id: 'me', x: 0, z: 0, radius: 2.5, title: 'ME (Central Me)', text: "The starting point and central axis. Choose your path to explore your narrative.", theme: 'theme-me' },
  { id: 'past', x: -14, z: 0, radius: 4.5, title: 'Who I Was', text: "Childhood drawings, iconic toys, and a warm, safe atmosphere.", theme: 'theme-past' },
  { id: 'present', x: -14, z: -14, radius: 4.5, title: 'Who I Am', text: "A modern studio defining your current identity: sneakers, synth setup, and gaming.", theme: 'theme-present' },
  { id: 'future', x: 0, z: -14, radius: 4.5, title: 'Who I Will Be', text: "Future aspirations and growth: vertical gardens, coffee mastery, and acoustic peace.", theme: 'theme-future' },
];

const BUILD_AREAS = [
  { xMin: -3, xMax: 3, zMin: -3, zMax: 3 }, // Me
  { xMin: -19, xMax: -9, zMin: -5, zMax: 5 }, // Past (left)
  { xMin: -19, xMax: -9, zMin: -19, zMax: -9 }, // Present (top-diagonal)
  { xMin: -5, xMax: 5, zMin: -19, zMax: -9 }, // Future (up-right)
  { xMin: -9, xMax: -3, zMin: -1, zMax: 1 }, // Cor Past
  { xMin: -1, xMax: 1, zMin: -9, zMax: -3 }, // Cor Future
];

// Define obstacles to restrict movement
export const OBSTACLES = [
  // Past Room
  { id: 'past_toy_shelf', x: -14, y: 1, z: -4.5, width: 4, height: 2, depth: 1 },
  { id: 'past_drawings_wall', x: -18.5, y: 1.5, z: 0, width: 1, height: 3, depth: 4 },
  { id: 'past_play_table', x: -14, y: 0.5, z: 2, width: 3, height: 1, depth: 3 },

  // Present Room (-14, -14)
  { id: 'present_tv_stand', x: -18.5, y: 0.5, z: -14, width: 1, height: 1, depth: 4 },
  { id: 'present_synth_desk', x: -14, y: 0.8, z: -18.5, width: 4, height: 1, depth: 1 },
  { id: 'present_sneaker_wall', x: -9.5, y: 1.5, z: -14, width: 1, height: 3, depth: 5 },

  // Future Room (0, -14)
  { id: 'future_plant_wall', x: 0, y: 1.5, z: -18.5, width: 4, height: 3, depth: 1 },
  { id: 'future_coffee_bar', x: 4.5, y: 1, z: -14, width: 1, height: 2, depth: 4 },
  { id: 'future_audio_setup', x: 0, y: 0.8, z: -9.5, width: 3, height: 1.6, depth: 1 },
];

function inDiagonalCorridor(x: number, z: number) {
  const width = 1.0; // half-width
  const dist = Math.abs(x - z) / Math.SQRT2;
  const along = x + z;
  return dist <= width + 0.05 && along <= -5 && along >= -19;
}

function pointInAnyArea(x: number, z: number) {
  const eps = 0.001; // Tiny tolerance for floating point imprecision
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
      <meshToonMaterial color={color} />
      <Edges color="#000000" scale={1.001} />
    </mesh>
  );
}

function Room({ position, size, floorColor = "#c29469", hasWalls = false }: { position: [number, number, number], size: [number, number], floorColor?: string, hasWalls?: boolean }) {
  return (
    <group position={position}>
      {/* Floor with thick outlines for pixel art look */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.5, size[1]]} />
        <meshToonMaterial color={floorColor} />
        <Edges color="#000000" scale={1.001} />
      </mesh>
      
      {hasWalls && (
        <>
          {/* Back-Left Wall (z-axis) */}
          <mesh position={[-size[0]/2 - 0.25, 2, -0.25]} receiveShadow>
            <boxGeometry args={[0.5, 4, size[1] + 0.5]} />
            <meshToonMaterial color={floorColor} />
            <Edges color="#000000" scale={1.001} />
          </mesh>

          {/* Back-Right Wall (x-axis) */}
          <mesh position={[-0.25, 2, -size[1]/2 - 0.25]} receiveShadow>
            <boxGeometry args={[size[0] + 0.5, 4, 0.5]} />
            <meshToonMaterial color={floorColor} />
            <Edges color="#000000" scale={1.001} />
          </mesh>
        </>
      )}
    </group>
  );
}

// --- Thematic Rooms ---

function PastRoom() {
  return (
    <group position={[-14, 0, 0]}>
      {/* Light for warm atmosphere */}
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#fcd34d" distance={15} castShadow />

      {/* Toy Shelf (Top Wall) */}
      <Block position={[0, 1, -4.5]} size={[4, 2, 1]} color="#8b5cf6" />
      {/* Toys on shelf */}
      <Block position={[-1, 2.2, -4.5]} size={[0.4, 0.4, 0.4]} color="#ef4444" />
      <Block position={[0, 2.2, -4.5]} size={[0.8, 0.4, 0.4]} color="#eab308" />
      <Block position={[1, 2.3, -4.5]} size={[0.6, 0.6, 0.6]} color="#3b82f6" />

      {/* Drawings Wall (Left Wall) */}
      <Block position={[-4.5, 1.5, 0]} size={[1, 3, 4]} color="#fdf8f6" />
      <Block position={[-4.4, 1.5, 0]} size={[0.1, 0.8, 1]} color="#f43f5e" />
      <Block position={[-4.4, 2, -1]} size={[0.1, 0.6, 0.8]} color="#10b981" />

      {/* Play Table */}
      <Block position={[0, 0.5, 2]} size={[3, 1, 3]} color="#fb923c" />
      <Block position={[0, 1.1, 2]} size={[1.5, 0.2, 1.5]} color="#22c55e" /> {/* Playmat/Board */}
    </group>
  );
}

function PresentRoom() {
  return (
    <group position={[-14, 0, -14]}>
      {/* Light for modern studio */}
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#a7f3d0" distance={15} castShadow />

      {/* TV & PS5 (Left Wall) */}
      <Block position={[-4.5, 0.5, 0]} size={[1, 1, 4]} color="#1e293b" /> {/* Stand */}
      <Block position={[-4.5, 1.8, 0]} size={[0.2, 1.6, 3]} color="#0f172a" /> {/* TV Screen */}
      <Block position={[-4.5, 1.2, 1.5]} size={[0.4, 0.8, 0.2]} color="#f8fafc" /> {/* PS5 */}

      {/* Synth Desk (Top Wall) */}
      <Block position={[0, 0.8, -4.5]} size={[4, 1, 1]} color="#334155" /> {/* Desk */}
      <Block position={[0, 1.4, -4.5]} size={[2, 0.2, 0.6]} color="#111827" /> {/* Synth Keyboard */}
      <Block position={[-1.5, 1.4, -4.5]} size={[0.4, 0.6, 0.4]} color="#cbd5e1" /> {/* Speaker L */}
      <Block position={[1.5, 1.4, -4.5]} size={[0.4, 0.6, 0.4]} color="#cbd5e1" /> {/* Speaker R */}

      {/* Sneaker Wall (Right Wall) */}
      <Block position={[4.5, 1.5, 0]} size={[1, 3, 5]} color="#e2e8f0" />
      <Block position={[4.4, 1, -1]} size={[0.4, 0.3, 0.6]} color="#ef4444" />
      <Block position={[4.4, 1.8, 0]} size={[0.4, 0.3, 0.6]} color="#3b82f6" />
      <Block position={[4.4, 2.6, 1]} size={[0.4, 0.3, 0.6]} color="#10b981" />
    </group>
  );
}

function FutureRoom() {
  return (
    <group position={[0, 0, -14]}>
      {/* Light for peaceful atmosphere */}
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#fef08a" distance={15} castShadow />

      {/* Vertical Garden (Top Wall) */}
      <Block position={[0, 1.5, -4.5]} size={[4, 3, 1]} color="#14532d" />
      <Block position={[-1, 2, -4.4]} size={[0.8, 0.8, 0.8]} color="#22c55e" />
      <Block position={[1, 1.5, -4.4]} size={[1, 1, 1]} color="#4ade80" />
      <Block position={[0, 2.5, -4.4]} size={[0.6, 0.6, 0.6]} color="#16a34a" />

      {/* Coffee Bar (Right Wall) */}
      <Block position={[4.5, 1, 0]} size={[1, 2, 4]} color="#78350f" /> {/* Wood Bar */}
      <Block position={[4.5, 2.2, 0]} size={[0.6, 0.4, 0.6]} color="#94a3b8" /> {/* Espresso Machine */}

      {/* Audio/Guitar Setup (Bottom Wall) */}
      <Block position={[0, 0.8, 4.5]} size={[3, 1.6, 1]} color="#b45309" /> {/* Wood Table */}
      <Block position={[0, 1.7, 4.5]} size={[1, 0.1, 1]} color="#1e293b" /> {/* Turntable */}
      <Block position={[-1, 1.2, 4.2]} size={[0.4, 1.4, 0.4]} color="#d97706" /> {/* Guitar */}
    </group>
  );
}

function Apartment() {
  return (
    <group>
      {/* Floors */}
      <Room position={[0, 0, 0]} size={[6, 6]} floorColor="#e5e5e5" /> {/* Me Room (Neutral) */}
      <Room position={[-14, 0, 0]} size={[10, 10]} floorColor="#fed7aa" hasWalls={true} /> {/* Past (Warm) */}
      <Room position={[-14, 0, -14]} size={[10, 10]} floorColor="#94a3b8" hasWalls={true} /> {/* Present (Modern) */}
      <Room position={[0, 0, -14]} size={[10, 10]} floorColor="#bbf7d0" hasWalls={true} /> {/* Future (Nature) */}

      {/* Corridors */}
      <Room position={[-6, 0, 0]} size={[6, 2]} floorColor="#e5e5e5" />
      <Room position={[0, 0, -6]} size={[2, 6]} floorColor="#e5e5e5" />

      {/* Diagonal Corridor to Present */}
      <group position={[-6, 0, -6]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.26, 0]} receiveShadow>
          <boxGeometry args={[2, 0.5, 8.5]} />
          <meshToonMaterial color="#e5e5e5" />
          <Edges color="#000000" scale={1.001} />
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
        const dist = Math.sqrt(
          Math.pow(meshRef.current.position.x - zone.x, 2) +
          Math.pow(meshRef.current.position.z - zone.z, 2)
        );
        if (dist < zone.radius) {
          activeZone = zone.id as ZoneType;
          break;
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
      <meshToonMaterial color="#38bdf8" />
      <Edges color="#000000" scale={1.001} />
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

      <Canvas shadows gl={{ antialias: false }} dpr={0.3}>
        <OrthographicCamera makeDefault position={[15, 15, 15]} zoom={40} />
        {/* Slightly brighter ambient light for the cartoon look */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[512, 512]}
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
