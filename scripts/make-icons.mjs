// Génère le logo (icon.svg) et les icônes PNG du site : monogramme « T » de Tranonay au-dessus d'une vague d'eau.
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="Tranonay">
  <defs><clipPath id="c"><rect width="256" height="256" rx="${rx}" /></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="256" height="256" fill="#C2410C" />
    <circle cx="216" cy="52" r="18" fill="#FDBA74" opacity="0.55" />
    <path d="M0 178 C40 160 72 196 112 178 S190 160 256 180 V256 H0Z" fill="#10B981" opacity="0.55" />
    <path d="M0 192 C44 174 78 210 120 192 S196 176 256 194 V256 H0Z" fill="#047857" />
  </g>
  <rect x="64" y="52" width="128" height="36" rx="10" fill="#fff" />
  <rect x="110" y="52" width="36" height="116" rx="10" fill="#fff" />
</svg>`

writeFileSync('public/icon.svg', svg(56))
// PNG « pleine page » (sans coins transparents) : adaptés à iOS et aux icônes maskable.
for (const [file, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  await sharp(Buffer.from(svg(0))).resize(size, size).png().toFile(`public/${file}`)
}
console.log('icônes générées')
