const fs = require('fs');
let content = fs.readFileSync('c:/Users/flavi/Documents/Travail/Études sup/ECE - Cycle Ingénieur/ING3/Cours/S6/London/Personal devlopement & Leadership/Project/app/src/App.tsx', 'utf8');

const obj = 'LegoStarWarsATAT';
let fnStart = content.indexOf('function ' + obj + '(');
let fnEnd = content.indexOf('function ', fnStart + 10);

let fnBody = content.substring(fnStart, fnEnd);

fnBody = fnBody.replace('const [clicked, setClicked] = useState(false);', 'const [clicked, setClicked] = useState(false);\n  const [found, setFound] = useState(false);\n  const [isHinting, setIsHinting] = useState(false);\n  const hintStartTime = useRef(0);');

fnBody = fnBody.replace('const handleClick =', "useEffect(() => {\n    const handleHint = () => { if (!found) setIsHinting(true); };\n    window.addEventListener('hint-blink', handleHint);\n    return () => window.removeEventListener('hint-blink', handleHint);\n  }, [found]);\n\n  const handleClick =");

fnBody = fnBody.replace(/window\.dispatchEvent\(new CustomEvent\('block-clicked', \{ detail: willBeClicked \? text : null \}\)\);/, "window.dispatchEvent(new CustomEvent('block-clicked', { detail: willBeClicked ? text : null }));\n    if (willBeClicked && !found) {\n      setFound(true);\n      window.dispatchEvent(new CustomEvent('object-discovered', { detail: text }));\n    }");

const hintLogic = "\n    let hintPulse = 0;\n    if (isHinting) {\n      if (hintStartTime.current === 0) hintStartTime.current = state.clock.elapsedTime;\n      const t = state.clock.elapsedTime - hintStartTime.current;\n      if (t < 2.0) {\n        hintPulse = Math.abs(Math.sin(t * Math.PI * 2)) * 0.8;\n      } else {\n        setIsHinting(false);\n        hintStartTime.current = 0;\n      }\n    }\n  ";

fnBody = fnBody.replace('if (!groupRef.current) return;', 'if (!groupRef.current) return;' + hintLogic);

fnBody = fnBody.replace(/mat\.emissiveIntensity = THREE\.MathUtils\.lerp\(mat\.emissiveIntensity, targetGlow, (.*?)\);/g, 'mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow + hintPulse, $1);');
fnBody = fnBody.replace(/else lightRef\.current\.intensity = THREE\.MathUtils\.lerp\(lightRef\.current\.intensity, 0, (.*?)\);/g, 'else lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isHinting ? hintPulse * 3 : 0, $1);');

content = content.substring(0, fnStart) + fnBody + content.substring(fnEnd);

fs.writeFileSync('c:/Users/flavi/Documents/Travail/Études sup/ECE - Cycle Ingénieur/ING3/Cours/S6/London/Personal devlopement & Leadership/Project/app/src/App.tsx', content, 'utf8');
console.log('Patched LegoStarWarsATAT!');
