const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
content = content.replace(
  "import draftingTableUrl from '../public/models/drafting_table.glb?url';",
  "import draftingTableUrl from '../public/models/drafting_table.glb?url';\nimport meUrl from '../public/models/me.glb?url';"
);

// Find Player function
const playerStart = content.indexOf('function Player(');
const playerEnd = content.indexOf('function App()'); // next top-level function

const playerReplacement = `function Player({ setZone, active }: { setZone: (z: ZoneType) => void, active: boolean }) {
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
`;

content = content.substring(0, playerStart) + playerReplacement + content.substring(content.indexOf('// --- Main App Component ---', playerStart));

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Player replaced!');
