/**
 * Prix mini et maxi des chambres visibles.
 * @param {{ price: number }[]} rooms
 * @returns {{ min: number, max: number } | null} `null` quand il n'y a aucune chambre.
 */
export function roomPriceRange(rooms) {
  if (!rooms || rooms.length === 0) return null
  const prices = rooms.map((room) => room.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
