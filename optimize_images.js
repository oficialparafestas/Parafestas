import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.join(process.cwd(), 'IMG', 'GALERIA');

async function optimizeImages() {
  try {
    const files = fs.readdirSync(IMG_DIR);
    
    for (const file of files) {
      if (file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png')) {
        const filePath = path.join(IMG_DIR, file);
        const outPath = path.join(IMG_DIR, file.replace(/\.(jpeg|jpg|png)$/i, '.webp'));
        
        console.log(`Otimizando: ${file}`);
        await sharp(filePath)
          .webp({ quality: 80 })
          .toFile(outPath);
          
        console.log(`Pronto: ${outPath}`);
      }
    }
    console.log('Todas as imagens foram otimizadas!');
  } catch (error) {
    console.error('Erro ao otimizar imagens:', error);
  }
}

optimizeImages();
