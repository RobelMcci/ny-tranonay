import { business } from '../data/site.js'
import { formatDateFr } from './quote.js'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Choisit dans un srcset l'URL dont la largeur est la plus proche de `width`. */
export const pickFromSrcSet = (srcSet, width) => {
  const candidates = srcSet.split(',').map((part) => {
    const [url, w] = part.trim().split(/\s+/)
    return { url, w: parseInt(w, 10) }
  })
  return candidates.reduce((best, c) => (Math.abs(c.w - width) < Math.abs(best.w - width) ? c : best)).url
}

const wrapLines = (ctx, text, maxWidth) => {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

const clipRounded = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
  ctx.clip()
}

/** Dessine la carte d'invitation (PNG partageable) sur un <canvas>. */
export async function drawInvitation(canvas, { eventType, date, host, photoUrl }) {
  const ctx = canvas.getContext('2d')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT

  // Les polices du site doivent être chargées avant de dessiner dessus.
  await Promise.allSettled([
    document.fonts.load('600 80px "Fraunces Variable"'),
    document.fonts.load('500 32px "Inter Variable"'),
  ])

  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  bg.addColorStop(0, '#C2410C')
  bg.addColorStop(1, '#047857')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const margin = 70
  const innerW = CARD_WIDTH - margin * 2

  try {
    const img = await loadImage(photoUrl)
    ctx.save()
    clipRounded(ctx, margin, margin, innerW, 560, 36)
    const scale = Math.max(innerW / img.width, 560 / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, margin + (innerW - w) / 2, margin + (560 - h) / 2, w, h)
    ctx.restore()
  } catch {
    // Photo indisponible : la carte reste valide, juste sans image.
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#FDE68A'
  ctx.font = '600 30px "Inter Variable", sans-serif'
  ctx.fillText('VOUS ÊTES INVITÉ(E)', CARD_WIDTH / 2, 700)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 84px "Fraunces Variable", Georgia, serif'
  let y = 800
  for (const line of wrapLines(ctx, eventType || 'À une belle journée', innerW).slice(0, 2)) {
    ctx.fillText(line, CARD_WIDTH / 2, y)
    y += 94
  }

  ctx.font = '500 44px "Inter Variable", sans-serif'
  ctx.fillText(formatDateFr(date) || 'Date à confirmer', CARD_WIDTH / 2, y + 20)

  ctx.font = '500 34px "Inter Variable", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.fillText(`Chez ${business.name}`, CARD_WIDTH / 2, y + 90)
  ctx.font = '400 28px "Inter Variable", sans-serif'
  ctx.fillText(`${business.address.street}, ${business.address.city}`, CARD_WIDTH / 2, y + 135)

  if (host) {
    ctx.font = 'italic 500 36px "Fraunces Variable", Georgia, serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(`De la part de ${host}`, CARD_WIDTH / 2, CARD_HEIGHT - 120)
  }
  ctx.font = '400 24px "Inter Variable", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText(`Renseignements : ${business.phone}`, CARD_WIDTH / 2, CARD_HEIGHT - 70)
}
