import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { textureCompress, dedup, prune } from '@gltf-transform/functions';
import sharp from 'sharp';

// Add KHR_texture_basisu extension if we wanted KTX2, but we'll use WebP (EXT_texture_webp)
import { EXTTextureWebP } from '@gltf-transform/extensions';

const io = new NodeIO()
  .registerExtensions([EXTTextureWebP]);

const modelsDir = path.join(process.cwd(), 'public', 'models');

async function optimizeModels() {
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));

  for (const file of files) {
    const filePath = path.join(modelsDir, file);
    console.log(`\nOptimizing ${file}...`);
    
    const originalSize = fs.statSync(filePath).size;
    
    try {
      const document = await io.read(filePath);

      // Apply transformations
      await document.transform(
        
        // Convert all textures to WebP
        textureCompress({
          encoder: sharp,
          targetFormat: 'webp',
          quality: 75
        }),

        // Remove unused nodes/materials
        prune(),

        // Deduplicate materials/textures/accessors
        dedup()
      );

      // Save back to the same file
      await io.write(filePath, document);
      
      const newSize = fs.statSync(filePath).size;
      const reduction = ((1 - newSize / originalSize) * 100).toFixed(2);
      console.log(`✅ ${file}: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(newSize / 1024 / 1024).toFixed(2)} MB (-${reduction}%)`);
    } catch (e) {
      console.error(`❌ Error optimizing ${file}:`, e.message);
    }
  }
}

optimizeModels().then(() => console.log('\nAll done!'));
