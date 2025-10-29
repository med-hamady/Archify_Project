const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Dossier contenant les images JPG
const inputDir = path.join(__dirname, 'public', 'images', 'badges');
const badges = ['argent.jpg', 'bois.jpg', 'bronze.jpg', 'diamant.jpg', 'mondial.jpg', 'or.jpg', 'platine.jpg'];

async function convertToTransparentPNG(inputPath, outputPath) {
  try {
    console.log(`Converting ${path.basename(inputPath)}...`);

    // Charger l'image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Convertir en PNG avec suppression du fond noir
    await image
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        // Créer un buffer RGBA avec transparence
        const rgbaData = Buffer.alloc(info.width * info.height * 4);

        for (let i = 0; i < data.length; i += info.channels) {
          const idx = (i / info.channels) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Détecter le noir et le rendre transparent
          // Seuil: si RGB sont tous < 30, considérer comme noir
          const isBlack = r < 30 && g < 30 && b < 30;

          if (isBlack) {
            // Transparent
            rgbaData[idx] = 0;
            rgbaData[idx + 1] = 0;
            rgbaData[idx + 2] = 0;
            rgbaData[idx + 3] = 0;
          } else {
            // Garder la couleur originale
            rgbaData[idx] = r;
            rgbaData[idx + 1] = g;
            rgbaData[idx + 2] = b;
            rgbaData[idx + 3] = 255; // Opaque
          }
        }

        // Créer l'image PNG avec le buffer RGBA
        return sharp(rgbaData, {
          raw: {
            width: info.width,
            height: info.height,
            channels: 4
          }
        })
        .png()
        .toFile(outputPath);
      });

    console.log(`✓ Converted ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Error converting ${path.basename(inputPath)}:`, error.message);
  }
}

async function convertAllBadges() {
  console.log('Starting badge conversion to transparent PNG...\n');

  for (const badge of badges) {
    const inputPath = path.join(inputDir, badge);
    const outputPath = path.join(inputDir, badge.replace('.jpg', '.png'));

    if (fs.existsSync(inputPath)) {
      await convertToTransparentPNG(inputPath, outputPath);
    } else {
      console.log(`⚠ File not found: ${badge}`);
    }
  }

  console.log('\n✓ All badges converted!');
  console.log('You can now delete the .jpg files and update the code to use .png');
}

convertAllBadges().catch(console.error);
