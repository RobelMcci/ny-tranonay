import { cloneElement, isValidElement } from 'react'

/**
 * Champ de formulaire accessible : étiquette liée, aide et erreur reliées au contrôle.
 *
 * `children` est soit une fonction `(controlProps) => <input {...controlProps} />`,
 * soit un unique élément (par exemple `<input />`) qui reçoit ces propriétés.
 * `controlProps` = { id, 'aria-describedby', 'aria-invalid' }.
 *
 * @param {{ label: string, id: string, hint?: string, error?: string | null, children: any, className?: string }} props
 */
export default function Field({ label, id, hint, error, children, className = '' }) {
  const hintId = hint ? `${id}-aide` : null
  const errorId = error ? `${id}-erreur` : null
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const controlProps = { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }

  const control = typeof children === 'function' ? children(controlProps) : isValidElement(children) ? cloneElement(children, controlProps) : children

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 mb-1.5 text-sm text-slate-700">
          {hint}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  )
}
