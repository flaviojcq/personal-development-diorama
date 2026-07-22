import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useTexture, Html, useGLTF, Center, useAnimations, Bvh, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import lightParquetUrl from './assets/light_parquet.jpg';
import darkParquetUrl from './assets/dark_parquet_3.jpg';
import moquetteUrl from './assets/moquette.webp';
import woodShelfUrl from '../public/models/wood_shelf.glb?url';
import lavaLampUrl from '../public/models/lava_lamp.glb?url';
import jeepUrl from '../public/models/jeep.glb?url';
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
import speakerUrl from '../public/models/speaker.glb?url';
import bedUrl from '../public/models/bed.glb?url';
import carpetUrl from '../public/models/persian_carpet.glb?url';
import catUrl from '../public/models/an_animated_cat.glb?url';
import dogUrl from '../public/models/bullcat.glb?url';
import ps5GamingSetupUrl from '../public/models/ps5_gaming_setup.glb?url';
import officeChairUrl from '../public/models/office_chair.glb?url';
import shoeRackUrl from '../public/models/shoe_rack.glb?url';
import aj1Chicagourl from '../public/models/aj1_chicago.glb?url';
import nikeShoeBoxUrl from '../public/models/nike_shoe_box.glb?url';
import floorLampUrl from '../public/models/floor_lamp.glb?url';
import bookUrl from '../public/models/book.glb?url';
import roundChairUrl from '../public/models/round_chair.glb?url';
import legoStarWarsATATUrl from '../public/models/lego_star_wars_at_at.glb?url';
import legoStarWarsIIIAATUrl from '../public/models/lego_star_wars_iii_aat.glb?url';
import draftingTableUrl from '../public/models/drafting_table.glb?url';
import meUrl from '../public/models/me.glb?url';
import './index.css';

// --- Types & Constants ---
type ZoneType = 'none' | 'me' | 'past' | 'present' | 'future';

const ZONES = [
  { id: 'me', type: 'circle', x: 0, z: 0, size: 6.0, title: 'ME (Central Me)', text: "Welcome to the core of my journey. This central space connects who I was, who I am, and who I aspire to be. Choose a path to explore the passions, values, and experiences that shape my story.", theme: 'theme-me' },
  { id: 'past', type: 'square', x: -20, z: 0, size: 7.0, title: 'Who I Was', text: "Welcome to the room representing my past. It embodies my childhood and teenage years. Through the objects in this room, discover my passions from that time and how they shaped my core values.", theme: 'theme-past' },
  { id: 'present', type: 'square', x: -20, z: -20, size: 7.0, title: 'Who I Am', text: "Welcome to the room representing who I am today. It highlights the passions I am currently developing and holding closest to my heart, reflecting how they actively shape the person I am right now.", theme: 'theme-present' },
  { id: 'future', type: 'square', x: 0, z: -20, size: 7.0, title: 'Who I Will Be', text: "This room is designed to represent the version of myself I aspire to become / bringing more calmness and color into my life, while taking care never to lose touch with the person I am today and the person I used to be.", theme: 'theme-future' },
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
  // --- Past Room (group offset: x:-20, z:0) ---
  // RoundChair: local [-5, -5] → global [-25, -5]
  { id: 'past_round_chair', x: -25, y: 0, z: -5, width: 3.2, height: 2, depth: 3.2 },
  // WoodShelf: local [-6.5, 0] → global [-26.5, 0]
  { id: 'past_wood_shelf', x: -26.5, y: 0, z: 0, width: 2.2, height: 3, depth: 5 },
  // DraftingTable:
  { id: 'past_drafting_table', x: -16, y: 0, z: -5.3, width: 4, height: 2, depth: 2.5 },
  // DraftingTableChair:
  { id: 'past_drafting_table_chair', x: -16.6, y: 0, z: -3, width: 1, height: 2, depth: 1 },
  // Jeep: local [-5, 5] → global [-25, 5]
  { id: 'past_jeep', x: -25, y: 0, z: 5, width: 3, height: 2, depth: 4 },

  // --- Present Room (group offset: x:-20, z:-20) ---
  // Piano: local [-5.8, 0] → global [-25.8, -20]
  { id: 'present_piano', x: -26.3, y: 0, z: -20, width: 1.5, height: 2, depth: 3.8 },
  // Piano Chair:
  { id: 'present_piano_chair', x: -25, y: 0, z: -20, width: 1, height: 2, depth: 1.9 },
  // Bed: local [4, -3.2] → global [-16, -23.2]
  { id: 'present_bed', x: -16, y: 0, z: -23.2, width: 6.6, height: 4, depth: 7 },
  // PS5 Gaming Setup: local [-3, -7.5] → global [-23, -27.5]
  { id: 'present_ps5', x: -22.8, y: 0, z: -26, width: 4.3, height: 2, depth: 2.7 },
  // OfficeChair: local [-4, -3.5] → global [-24, -23.5]
  { id: 'present_office_chair', x: -24, y: 0, z: -23.5, width: 2, height: 2, depth: 2 },
  // ShoeRack + AJ1: local [-2, 6.3] → global [-22, -13.7]
  { id: 'present_shoe_rack', x: -22, y: 0, z: -13.7, width: 3.5, height: 2, depth: 1.5 },
  // ShoeBox + AJ1: local [-2, 6.3] → global [-22, -13.7]
  { id: 'present_shoe_box', x: -19, y: 0, z: -13.7, width: 2, height: 1, depth: 1.5 },
  // FloorLamp: local [-5.5, 6.2] → global [-25.5, -13.8]
  { id: 'present_floor_lamp', x: -25.5, y: 0, z: -13.8, width: 1, height: 3, depth: 1 },

  // --- Future Room (group offset: x:0, z:-20) ---
  // FiddleLeafPlant: local [-6, -6] → global [-6, -26]
  { id: 'future_fiddle_leaf', x: -6, y: 0, z: -26, width: 1.5, height: 3, depth: 1.5 },
  // HousePlant: local [-6, 6] → global [-6, -14]
  { id: 'future_house_plant', x: -6, y: 0, z: -14, width: 1.5, height: 2, depth: 1.5 },
  // UmbrellaPalm: local [6.5, -6] → global [6.5, -26]
  { id: 'future_umbrella_palm', x: 6.5, y: 0, z: -26, width: 1.5, height: 3, depth: 1.5 },
  // BirdsOfParadise: local [-1, -6] → global [-1, -26]
  { id: 'future_birds_paradise', x: -1, y: 0, z: -26, width: 1.5, height: 2, depth: 1.5 },
  // Monsterra: local [-4.5, -6] → global [-4.5, -26]
  { id: 'future_monsterra', x: -4.5, y: 0, z: -26, width: 1.5, height: 2, depth: 1.5 },
  // WassilyChair: local [0, -4.5] → global [0, -24.5]
  { id: 'future_wassily_chair', x: 1.5, y: 0, z: -25.5, width: 2.3, height: 2, depth: 2.3 },
  // Drawer: local [-6, 0] → global [-6, -20]
  { id: 'future_drawer', x: -6, y: 0, z: -20, width: 1.5, height: 2, depth: 4.5 },
  // Speaker Left: local [-6.2, -3] → global [-6.2, -23]
  { id: 'future_speaker_left', x: -6.2, y: 0, z: -23, width: 1, height: 1.5, depth: 1 },
  // Speaker Right: local [-6.2, 3] → global [-6.2, -17]
  { id: 'future_speaker_right', x: -6.2, y: 0, z: -17, width: 1, height: 1.5, depth: 1 },
  // Dog:
  { id: 'future_dog', x: -3, y: 0, z: -22, width: 1.5, height: 2, depth: 1.5 },
  // Cat:
  { id: 'future_cat', x: 3, y: 0, z: -22, width: 1.5, height: 2, depth: 1.5 },
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


function ParquetFloorMaterial({ size, url = lightParquetUrl }: { size: [number, number], url?: string }) {
  const texture = useTexture(url);

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
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Wassily Chair";

  const popupData = {
    affect: "This aligns perfectly with my passion for design and beautiful objects. I'm fascinated by this kind of design piece, especially their history and the impact they've had on our vision of interiors. Despite the often high prices, I'd love to start a collection of designer furniture and chairs in this style.",
    valueText: "Appreciation of Art & History. It reflects my ambition to surround myself with objects that have a story and a strong cultural significance, blending everyday life with artistic legacy."
  };

  // Se ferme si un autre objet est cliqué
  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
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

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  

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
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.15);
        }
      }
    });
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={0.08} />
        {/* Lumière d'ambiance douce sur le sol autour de la chaise */}
        <pointLight position={[0, 0.5, 0]} distance={5} intensity={clicked ? 1 : (hovered ? 0.5 : 0)} color="#fef08a" />
      </group>

      {/* Texte au clic */}
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fef08a' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
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
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(recordPLayerUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Record Player";

  const popupData = {
    affect: "This is deeply connected to my passion for music. I already have a record player and a small collection of vinyls with my favorite albums, but I want to continue this in the future to deepen my musical knowledge and listen to music actively rather than passively on streaming platforms.",
    valueText: "Intentionality & Appreciation. It symbolizes a desire to slow down, be present, and truly appreciate art, turning everyday listening into a meaningful experience."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#22c55e");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });
    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={0.001} />
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#22c55e" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#22c55e' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Orchid({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(orchidUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Orchid";

  const popupData = {
    affect: "I've always loved this plant. My grandmother always had one at her place, and my mother always has one at home too. It ties into my vision for the future, where I'd love to connect more with nature and plants.",
    valueText: "Connection to Nature & Family. It represents a living link to my family's habits and a desire for a peaceful, grounded environment in my future home."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#f472b6");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });
    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={0.15} />
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#f472b6" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#f472b6' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Piano({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(pianoUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Piano";

  const popupData = {
    affect: "I wanted to learn the piano because I find it to be one of the most beautiful instruments, and it's so accessible with lessons on YouTube.",
    valueText: "Continuous Learning & Art. It directly connects to my constant desire to learn new things and my deep passion for music. It shows that with dedication, you can teach yourself almost anything."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#c084fc");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    let targetY = 0;
    if (hovered) targetY += Math.sin(state.clock.elapsedTime * 5) * 0.05 + 0.05;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.2);
    const targetGlow = clicked ? 0.6 : (hovered ? 0.3 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.15);
      }
    });
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <Center bottom>
          <primitive object={scene} scale={0.00003} />
        </Center>
        <pointLight position={[0, 1, 0]} distance={5} intensity={clicked ? 1.0 : (hovered ? 0.5 : 0)} color="#c084fc" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#c084fc' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
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
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(dogUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Dog";

  const popupData = {
    affect: "I've had a dog in my life since I was little. My family always had Boxers, and I can't imagine my future without a dog as affectionate as that breed. My dream dog is a Basset Hound, but I think I'll first look into adopting a rescue dog.",
    valueText: "Empathy & Companionship. This lifelong passion for animals is something I hope to continue. It reminds me to keep learning about them while always treating them with the utmost respect."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#f97316");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });
    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={2.2} />
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#f97316" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#f97316' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function PS5GamingSetup({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(ps5GamingSetupUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "PS5 Gaming Setup";

  const popupData = {
    affect: "I've always loved playing video games, starting around age 6 or 7 with games like Mario Kart and LEGO Star Wars, leading up to highly competitive games today like Rainbow 6 Siege, which I often play with my childhood friend.",
    valueText: "Challenge & Self-Reflection. Competitive gaming demands constant self-reflection and continuous improvement. It pushes me to analyze my mistakes and always strive to get better, a mindset that translates to real life."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#38bdf8");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    let targetY = 0;
    if (hovered) targetY += Math.sin(state.clock.elapsedTime * 5) * 0.05 + 0.05;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.2);
    const targetGlow = clicked ? 0.5 : (hovered ? 0.25 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.15);
      }
    });
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={0.6} />
        <pointLight position={[0, 1, 0]} distance={5} intensity={clicked ? 1.0 : (hovered ? 0.5 : 0)} color="#38bdf8" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#38bdf8' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function OfficeChair({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(officeChairUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.025} />;
}

function ShoeRack({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(shoeRackUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={4} />;
}

function AJ1Chicago({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(aj1Chicagourl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const text = "Air Jordan 1 Chicago";

  const popupData = {
    affect: "This is undoubtedly my favorite pair of shoes, whether for the history behind this model and colorway, or simply because I dreamed of owning them as a teenager. They are part of my collection of about 30 pairs and truly represent several facets of who I am: design, sports, and collecting.",
    valueText: "Passion & Identity. Sneaker culture is a bridge between art, history, and personal expression. This pair reminds me that what we collect is often a reflection of what inspires us."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#ef4444");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    let targetY = 0;
    if (hovered) targetY += Math.sin(state.clock.elapsedTime * 5) * 0.05 + 0.05;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.2);
    // Slow rotation on hover for the sneaker showcase effect
    if (hovered) groupRef.current.rotation.y += 0.008;
    const targetGlow = clicked ? 0.6 : (hovered ? 0.3 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.15);
      }
    });
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <Center>
          <primitive object={scene} scale={4.5} />
        </Center>
        <pointLight position={[0, 0.5, 0]} distance={4} intensity={clicked ? 1.2 : (hovered ? 0.6 : 0)} color="#ef4444" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function NikeShoeBox({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(nikeShoeBoxUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={3.5} />;
}

function FloorLamp({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(floorLampUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={0.6} />;
}

function Book({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(bookUrl);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);
  const [showQuote, setShowQuote] = useState(false);

  const text = "The Creative Act";

  const popupData = {
    affect: "This is 'The Creative Act: A Way of Being' by Rick Rubin. I was never a big reader, but after learning about his life and his incredible contributions to music, I decided to dive into it.",
    valueText: "Curiosity & Open-Mindedness. It represents my willingness to step out of my comfort zone. Exploring new perspectives, even through mediums I usually avoid, can profoundly change how I view the creative process."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) {
        setClicked(false);
        setShowQuote(false);
      }
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#edc24bff");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  

    // Flottement léger en idle (respiration douce), plus fort au survol
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

    // Emissive : toujours allumé légèrement, plus fort au survol/clic
    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });

    // Pulsation du halo de lumière
    if (lightRef.current) {
      if (clicked) {
        // Stable et fort au clic
        lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      } else if (hovered) {
        // Pulsation rapide au survol
        lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      } else {
        // Plus de pulsation en idle
        lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
      }
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={1} />
        {/* Halo permanent avec pulsation */}
        <pointLight
          ref={lightRef}
          position={[0, 0.3, 0]}
          color="#edc24b"
          intensity={0.2}
          distance={3}
          decay={2}
        />
      </group>

      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#edc24b' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                className="quote-button"
                onClick={(e) => { e.stopPropagation(); setShowQuote(!showQuote); }}
              >
                {showQuote ? 'Hide Favorite Quote' : 'Show Favorite Quote'}
              </button>
            </div>
            {showQuote && (
              <div className="popup-quote">
                "Think of the outside world, for example, as a conveyor belt with a continuous stream of small packages passing by you. The first step is to notice the conveyor belt is there. Then, whenever you feel like it, you can grab a package, unwrap it, and see what's inside."
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function RoundChair({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(roundChairUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return (
    <group position={position} rotation={rotation}>
      <Center bottom>
        <primitive object={scene} scale={0.08} />
      </Center>
    </group>
  );
}

function LegoStarWarsATAT({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);

  const { scene, animations } = useGLTF(legoStarWarsATATUrl);
  const { actions } = useAnimations(animations, groupRef);

  const text = "LEGO Star Wars AT-AT";

  const popupData = {
    affect: "This object mixes two areas of pop culture I absolutely love: LEGO and Star Wars. LEGO remains a huge passion of mine.",
    valueText: "Patience & Satisfaction. I deeply appreciate the patience required to build large sets and the immense satisfaction that comes from completing them."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#ffffff");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    const firstAction = Object.values(actions)[0];
    if (firstAction) {
      firstAction.reset().play();
    }
  }, [actions]);

  useFrame((state) => {
    if (!groupRef.current) return;
    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });

    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <primitive object={scene} scale={0.2} />
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#ffffff" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ffffff' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function LegoStarWarsIIIAAT({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(legoStarWarsIIIAATUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return (
    <group position={position} rotation={rotation}>
      <Center bottom>
        <primitive object={scene} scale={0.7} />
      </Center>
    </group>
  );
}

function DraftingTable({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);
  const { scene } = useGLTF(draftingTableUrl);

  const text = "Drafting Table";

  const popupData = {
    affect: "This desk was more of a dream than a real object from my past... but I always loved drawing. I drew constantly from age 10 to 15, even taking classes, until that passion naturally cooled down and I moved on to other things.",
    valueText: "Creativity & Evolution. It reminds me that passions can evolve. The creativity I poured into drawing didn't disappear; it simply shifted into my love for design and problem-solving today."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#fbcfe8");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });

    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <Center bottom>
          <primitive object={scene} scale={0.8} />
        </Center>
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#fbcfe8" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fbcfe8' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function WoodShelf({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(woodShelfUrl);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  }, [scene]);
  return (
    <group position={position} rotation={rotation}>
      <Center bottom>
        <primitive object={scene} scale={1.2} />
      </Center>
    </group>
  );
}

function LavaLamp({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);
  const { scene } = useGLTF(lavaLampUrl);

  const text = "Lava Lamp";

  const popupData = {
    affect: "I don't really remember where this lamp came from, but it belonged to my mother. It always fascinated me, and I always wanted to understand how it worked. I believe this early curiosity pushed me towards science and ultimately influenced my educational path.",
    valueText: "Continuous Learning & Curiosity. The desire to figure out how the lava lamp works mirrors my core value: always seeking to learn and understand the world around me."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#ef4444");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });

    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <Center bottom>
          <primitive object={scene} scale={0.2} />
        </Center>
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#ef4444" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Jeep({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [found, setFound] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const hintStartTime = useRef(0);
  const { scene } = useGLTF(jeepUrl);

  const text = "Jeep";

  const popupData = {
    affect: "I've always loved playing with cars, from my childhood toys to video games. I remember the pure joy I felt driving a kid's car at my grandmother's house and playing with my cousins.",
    valueText: "Passion & Aesthetics. These early memories forged a true passion in my heart for classic cars, which ties directly into my primary passion for design and beautiful objects."
  };

  useEffect(() => {
    const handleOtherClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== text) setClicked(false);
    };
    window.addEventListener('block-clicked', handleOtherClick);
    return () => window.removeEventListener('block-clicked', handleOtherClick);
  }, [text]);

  useEffect(() => {
    const handleHint = () => { if (!found) setIsHinting(true); };
    window.addEventListener('hint-blink', handleHint);
    return () => window.removeEventListener('hint-blink', handleHint);
  }, [found]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const willBeClicked = !clicked;
    setClicked(willBeClicked);
    window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));
    if (willBeClicked && !found) {
      setFound(true);
      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));
    }
  };

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color("#22c55e");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    let hintPulse = 0;
    if (isHinting) {
      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - hintStartTime.current;
      if (t < 2.0) {
        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;
      } else {
        setIsHinting(false);
        hintStartTime.current = 0;
      }
    }
  
    const targetY = hovered ? Math.sin(state.clock.elapsedTime * 5) * 0.04 + 0.06 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

    const targetGlow = clicked ? 0.7 : (hovered ? 0.4 : 0);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, 0.1);
      }
    });

    if (lightRef.current) {
      if (clicked) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 1.5, 0.1);
      else if (hovered) lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
      else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, 0.1);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={handleClick}
    >
      <group ref={groupRef}>
        <Center bottom>
          <primitive object={scene} scale={0.65} />
        </Center>
        <pointLight ref={lightRef} position={[0, 1, 0]} distance={5} intensity={0} color="#22c55e" />
      </group>
      {clicked && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div className="popup-card" onPointerOver={(e) => e.stopPropagation()} onPointerOut={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#22c55e' }}>{text}</h3>
            <div className="popup-section">
              <h4>Personal Connection</h4>
              <p>{popupData.affect}</p>
            </div>
            <div className="popup-section">
              <h4>Core Value & Story</h4>
              <p>{popupData.valueText}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Room({ position, size, floorColor = "#dfcbb7", wallColor = "#ffffff", wallColorRight, hasWalls = false, isParquet = false, parquetUrl, shape = 'square', yOffset = 0 }: { position: [number, number, number], size: [number, number], floorColor?: string, wallColor?: string, wallColorRight?: string, hasWalls?: boolean, isParquet?: boolean, parquetUrl?: string, shape?: 'square' | 'circle', yOffset?: number }) {
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
            <ParquetFloorMaterial size={size} url={parquetUrl} />
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
            <meshStandardMaterial color={wallColorRight || wallColor} />
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
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#fc4d4d" distance={15} castShadow />

      {/* Round Chair (Top Wall) */}
      <Suspense fallback={<Block position={[3, 1, -6.5]} size={[2, 2, 1]} color="#1e1e1e" />}>
        <RoundChair position={[-5, 2.5, -5]} rotation={[0, Math.PI / 4, 0]} />
      </Suspense>

      {/* Lego Star Wars AT-AT */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <LegoStarWarsATAT position={[-6, 1.7, 1.8]} rotation={[0, Math.PI / 3, 0]} />
      </Suspense>

      {/* Lego Star Wars III AAT */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <LegoStarWarsIIIAAT position={[-6.2, 2.6, -1.2]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* Drafting Table (Front Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <DraftingTable position={[4, 3.7, -4.8]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* Wood Shelf (Left Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <WoodShelf position={[-6.5, 1.68, 0]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      {/* Lava Lamp */}
      <Suspense fallback={null}>
        <LavaLamp position={[-6.2, 3, 0.2]} />
      </Suspense>

      {/* Jeep */}
      <Suspense fallback={null}>
        <Jeep position={[-5, 1.7, 5]} rotation={[0, Math.PI / 8, 0]} />
      </Suspense>
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

      {/* Bed (Right Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <Bed position={[4, 3.4, -3.2]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* PS5 Gaming Setup (Left Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <PS5GamingSetup position={[-3, 1.8, -7.5]} rotation={[0, 0, 0]} />
      </Suspense>

      {/* Office Chair (Left Wall) */}
      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <OfficeChair position={[-4, 0, -3.5]} rotation={[0, 800, 0]} />
      </Suspense>

      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <ShoeRack position={[-2, 0, 6.3]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <AJ1Chicago position={[-2, 2.2, 6.3]} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>

      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <NikeShoeBox position={[1, 0, 6.1]} rotation={[0, - Math.PI / 8, 0]} />
      </Suspense>

      <Suspense fallback={<Block position={[-6.5, 1, 0]} size={[1, 2, 1]} color="#d97706" />}>
        <FloorLamp position={[-5.5, 4, 6.2]} rotation={[0, Math.PI, 0]} />
      </Suspense>

      {/* Book on the bed */}
      <Suspense fallback={<Block position={[4, 5, -3.2]} size={[0.5, 0.1, 0.3]} color="#8b5cf6" />}>
        <Book position={[4, 1.7, -2.5]} rotation={[0, Math.PI / 5, 0]} />
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
      <Room position={[-20, 0, 0]} size={[14, 14]} floorColor="#e3cea6" wallColor="#f1f5f9" wallColorRight="#f1f5f9" hasWalls={true} isParquet={true} parquetUrl={moquetteUrl} /> {/* Past */}
      <Room position={[-20, 0, -20]} size={[14, 14]} floorColor="#94a3b8" hasWalls={true} isParquet={true} parquetUrl={darkParquetUrl} /> {/* Present (Modern) */}
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

function Player({ setZone, active }: { setZone: (z: ZoneType) => void, active: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const keys = useKeyboard();
  const speed = 8;
  const { camera } = useThree();
  const camOffset = new THREE.Vector3(15, 15, 15);
  
  const { scene, animations } = useGLTF(meUrl);
  const { actions } = useAnimations(animations, meshRef);
  
  const [action, setAction] = useState('HumanArmature|Man_Idle');
  
  useEffect(() => {
    if (actions && actions[action]) {
      actions[action].reset().fadeIn(0.2).play();
      return () => {
        actions[action]?.fadeOut(0.2);
      };
    }
  }, [action, actions]);

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((_state, delta) => {
    if (!meshRef.current || !active) return;

    let dx = 0;
    let dz = 0;
    if (keys['w'] || keys['ArrowUp']) { dx -= 1; dz -= 1; }
    if (keys['s'] || keys['ArrowDown']) { dx += 1; dz += 1; }
    if (keys['a'] || keys['ArrowLeft']) { dx -= 1; dz += 1; }
    if (keys['d'] || keys['ArrowRight']) { dx += 1; dz -= 1; }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
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

      // Calculate rotation
      const angle = Math.atan2(dx, dz);
      let diff = angle - meshRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      meshRef.current.rotation.y += diff * 10 * delta;

      if (action !== 'HumanArmature|Man_Walk') setAction('HumanArmature|Man_Walk');

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
          const dxDist = Math.abs(meshRef.current.position.x - zone.x);
          const dzDist = Math.abs(meshRef.current.position.z - zone.z);
          if (dxDist <= zone.size && dzDist <= zone.size) {
            activeZone = zone.id as ZoneType;
            break;
          }
        }
      }
      setZone(activeZone);
    } else {
      if (action !== 'HumanArmature|Man_Idle') setAction('HumanArmature|Man_Idle');
    }

    camera.position.set(
      meshRef.current.position.x + camOffset.x,
      camOffset.y,
      meshRef.current.position.z + camOffset.z
    );
    camera.lookAt(meshRef.current.position);
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={1.0} />
    </group>
  );
}

// --- Main App Component ---
// --- Main App Component ---
function LoadingScreen({ onStarted }: { onStarted: () => void }) {
  const { progress } = useProgress();
  const [started, setStarted] = useState(false);

  return (
    <div className={`loading-screen ${started ? 'loading-screen--hidden' : ''}`}>
      <div className="loading-screen__container">
        <h1 className="loading-screen__title">My Personal Journey</h1>
        {progress < 100 ? (
          <div className="loading-screen__progress">
            <div className="loading-screen__bar-container">
              <div className="loading-screen__bar" style={{ width: `${progress}%` }}></div>
            </div>
            <p>Loading models... {Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="loading-screen__intro">
            <p>Welcome to the vision of my past, present, and future self. Explore the rooms and find the clickable objects.</p>
            <p className="loading-screen__hint">Can you find them all? (Hint: there are 4 per room)</p>
            <button
              className="loading-screen__button"
              onClick={() => {
                setStarted(true);
                onStarted();
              }}
            >
              Let's discover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function FoundCounter() {
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    const handleDiscovered = () => setFoundCount(prev => prev + 1);
    window.addEventListener('object-discovered', handleDiscovered);
    return () => window.removeEventListener('object-discovered', handleDiscovered);
  }, []);

  const triggerHint = () => {
    window.dispatchEvent(new CustomEvent('hint-blink'));
  };

  return (
    <div className="found-counter">
      <div className="found-counter__text">Objects Found: {foundCount} / 12</div>
      <button className="found-counter__hint-btn" onClick={triggerHint}>
        Need a hint?
      </button>
    </div>
  );
}

function App() {
  const [zone, setZone] = useState<ZoneType>('none');
  const [started, setStarted] = useState(false);
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

      <Canvas
        shadows
        gl={{
          antialias: false,
          toneMapping: THREE.LinearToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={0.5}
        onPointerMissed={() => window.dispatchEvent(new CustomEvent('block-clicked', { detail: null }))}
      >
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

        <Bvh firstHitOnly>
          <Apartment />
          <Player setZone={setZone} active={started} />
        </Bvh>
      </Canvas>
      <LoadingScreen onStarted={() => setStarted(true)} />
      {started && <FoundCounter />}

    </>
  );
}

export default App;

