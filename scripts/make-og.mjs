// Génère l'image de partage (Open Graph 1200×630) à partir d'une photo du site.
import sharp from 'sharp'

await sharp('src/assets/image36.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile('public/og-image.jpg')

console.log('public/og-image.jpg généré')
