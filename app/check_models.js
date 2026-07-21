import fs from 'fs';

function checkGLB(filename) {
  const file = fs.readFileSync(filename);
  const jsonChunkLength = file.readUInt32LE(12);
  const jsonStr = file.toString('utf8', 20, 20 + jsonChunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n=== ${filename} ===`);
  console.log("Nodes:", gltf.nodes?.map(n => n.name));

  if (gltf.accessors) {
    // Only check position accessors (VEC3)
    let first = true;
    for (let i = 0; i < gltf.accessors.length; i++) {
      const acc = gltf.accessors[i];
      if (acc.type === 'VEC3' && acc.min && first) {
        console.log(`Accessor ${i} - min:`, acc.min, "max:", acc.max);
        const sizeX = acc.max[0] - acc.min[0];
        const sizeY = acc.max[1] - acc.min[1];
        const sizeZ = acc.max[2] - acc.min[2];
        console.log(`Model size: X=${sizeX.toFixed(4)}, Y=${sizeY.toFixed(4)}, Z=${sizeZ.toFixed(4)}`);
        first = false;
      }
    }
  }
}

checkGLB('./public/models/record_player.glb');
checkGLB('./public/models/drawer.glb');
checkGLB('./public/models/wassily_chair.glb');
