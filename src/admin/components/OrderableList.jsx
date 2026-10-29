import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useId, useRef, useState } from 'react'
import { moveItem } from '../reorder.js'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]'
const iconButton = `touch-target inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-[#2B211B] hover:border-[#C2410C] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 ${focusRing}`

const defaultLabel = (item) => String(item.label ?? item.name ?? item.id)

const translate = (transform) => (transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined)

function Arrow({ direction }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'up' ? 'M5 12l5-5 5 5' : 'M5 8l5 5 5-5'} />
    </svg>
  )
}

function Row({ item, index, count, label, disabled, onMove, renderItem }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled })

  return (
    <li
      ref={setNodeRef}
      data-orderable-id={item.id}
      style={{ transform: translate(transform), transition, position: 'relative', zIndex: isDragging ? 10 : undefined }}
      className={`flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/10 ${isDragging ? 'shadow-lg ring-[#C2410C]/60' : ''}`}
    >
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`Déplacer « ${label} » (glisser, ou espace puis flèches du clavier)`}
          className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
            <circle cx="7" cy="5" r="1.6" />
            <circle cx="13" cy="5" r="1.6" />
            <circle cx="7" cy="10" r="1.6" />
            <circle cx="13" cy="10" r="1.6" />
            <circle cx="7" cy="15" r="1.6" />
            <circle cx="13" cy="15" r="1.6" />
          </svg>
        </button>
        <button
          type="button"
          data-move="up"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1, item.id, 'up')}
          aria-label={`Monter « ${label} »`}
          title="Monter"
          className={iconButton}
        >
          <Arrow direction="up" />
        </button>
        <button
          type="button"
          data-move="down"
          disabled={disabled || index === count - 1}
          onClick={() => onMove(index, index + 1, item.id, 'down')}
          aria-label={`Descendre « ${label} »`}
          title="Descendre"
          className={iconButton}
        >
          <Arrow direction="down" />
        </button>
      </div>
      <div className="min-w-0 flex-1">{renderItem(item, { index, count, isDragging, isFirst: index === 0, isLast: index === count - 1 })}</div>
    </li>
  )
}

/**
 * Liste réordonnable : glisser-déposer (poignée, souris, tactile ou clavier) ET boutons « Monter » / « Descendre ».
 * Les déplacements sont annoncés aux lecteurs d'écran. La liste ne garde aucun état d'ordre : elle appelle
 * `onReorder` avec le nouveau tableau, que le parent applique.
 *
 * @param {{
 *   items: { id: string | number }[],
 *   renderItem: (item: any, controls: { index: number, count: number, isDragging: boolean, isFirst: boolean, isLast: boolean }) => any,
 *   onReorder: (items: any[]) => void,
 *   getLabel?: (item: any) => string,
 *   disabled?: boolean,
 *   label?: string,
 * }} props
 */
export default function OrderableList({ items, renderItem, onReorder, getLabel = defaultLabel, disabled = false, label }) {
  const dndId = useId()
  const [announcement, setAnnouncement] = useState('')
  const pendingFocus = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const labelOf = (id) => {
    const item = items.find((candidate) => candidate.id === id)
    return item ? getLabel(item) : ''
  }
  const position = (id) => items.findIndex((candidate) => candidate.id === id) + 1
  const placed = (id, overId) => `${labelOf(id)} déplacé en position ${position(overId ?? id)} sur ${items.length}`

  const announcements = {
    onDragStart: ({ active }) => `« ${labelOf(active.id)} » saisi, position ${position(active.id)} sur ${items.length}.`,
    onDragOver: ({ active, over }) => `« ${labelOf(active.id)} » au-dessus de la position ${position(over?.id ?? active.id)} sur ${items.length}.`,
    onDragEnd: ({ active, over }) => `${placed(active.id, over?.id)}.`,
    onDragCancel: ({ active }) => `Déplacement annulé : « ${labelOf(active.id)} » reste en position ${position(active.id)} sur ${items.length}.`,
  }
  const screenReaderInstructions = {
    draggable: 'Pour déplacer cet élément, appuyez sur la barre d’espace, utilisez les flèches haut et bas, puis la barre d’espace pour le déposer, ou Échap pour annuler.',
  }

  const onMove = (from, to, id, direction) => {
    pendingFocus.current = { id, direction }
    setAnnouncement(`« ${labelOf(id)} » déplacé en position ${to + 1} sur ${items.length}`)
    onReorder(moveItem(items, from, to))
  }

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((item) => item.id === active.id)
    const to = items.findIndex((item) => item.id === over.id)
    onReorder(moveItem(items, from, to))
  }

  // Après un déplacement par bouton, le focus suit l'élément (ou l'autre bouton si l'on est arrivé en bout de liste).
  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    pendingFocus.current = null
    const row = [...document.querySelectorAll('[data-orderable-id]')].find((node) => node.dataset.orderableId === String(pending.id))
    if (!row) return
    const wanted = row.querySelector(`[data-move="${pending.direction}"]`)
    const other = row.querySelector(`[data-move="${pending.direction === 'up' ? 'down' : 'up'}"]`)
    if (wanted && !wanted.disabled) wanted.focus()
    else other?.focus()
  }, [items])

  return (
    <>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ announcements, screenReaderInstructions }}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
          <ul aria-label={label} className="grid gap-3">
            {items.map((item, index) => (
              <Row key={item.id} item={item} index={index} count={items.length} label={getLabel(item)} disabled={disabled} onMove={onMove} renderItem={renderItem} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </>
  )
}
