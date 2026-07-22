import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const objects = [
  'LavaLamp', 'LegoATAT', 'Jeep', 'DraftingTable',
  'AJ1Chicago', 'Book', 'Piano', 'PS5GamingSetup',
  'WassilyChair', 'RecordPlayer', 'Orchid', 'Dog'
];

for (const obj of objects) {
  let fnStart = content.indexOf(\unction \(\);
  if (fnStart === -1) {
    console.error("Not found", obj);
    continue;
  }
  let fnEnd = content.indexOf(\unction \, fnStart + 10);
  if (fnEnd === -1) fnEnd = content.indexOf(\unction App()\);
  
  let fnBody = content.substring(fnStart, fnEnd);

  // 1. Add states
  fnBody = fnBody.replace(
    'const [clicked, setClicked] = useState(false);', 
    'const [clicked, setClicked] = useState(false);\n  const [found, setFound] = useState(false);\n  const [isHinting, setIsHinting] = useState(false);\n  const hintStartTime = useRef(0);'
  );

  // 2. Add Hint useEffect
  fnBody = fnBody.replace(
    'const handleClick =',
    \useEffect(() => {\\n    const handleHint = () => { if (!found) setIsHinting(true); };\\n    window.addEventListener('hint-blink', handleHint);\\n    return () => window.removeEventListener('hint-blink', handleHint);\\n  }, [found]);\\n\\n  const handleClick =\
  );

  // 3. Update handleClick
  fnBody = fnBody.replace(
    /window\.dispatchEvent\\(new CustomEvent\\('block-clicked', \\{ detail: willBeClicked \\? text : null \\}\\)\\);/,
    \window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));\\n    if (willBeClicked && !found) {\\n      setFound(true);\\n      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));\\n    }\
  );

  // 4. Update useFrame
  const hintLogic = \
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
  \;

  fnBody = fnBody.replace(
    'if (!groupRef.current) return;',
    'if (!groupRef.current) return;\\n' + hintLogic
  );

  fnBody = fnBody.replace(/mat\\.emissiveIntensity = THREE\\.MathUtils\\.lerp\\(mat\\.emissiveIntensity, targetGlow, (.*?)\\);/g, 'mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, );');
  fnBody = fnBody.replace(/else lightRef\\.current\\.intensity = THREE\\.MathUtils\\.lerp\\(lightRef\\.current\\.intensity, 0, (.*?)\\);/g, 'else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, );');

  content = content.substring(0, fnStart) + fnBody + content.substring(fnEnd);
}

const foundCounterCode = \
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
\;

content = content.replace('function App() {', foundCounterCode + '\\nfunction App() {');
content = content.replace('<LoadingScreen onStarted={() => setStarted(true)} />', '<LoadingScreen onStarted={() => setStarted(true)} />\\n      {started && <FoundCounter />}\\n');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Patched all components!');
