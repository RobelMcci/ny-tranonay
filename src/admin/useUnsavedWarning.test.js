// @vitest-environment jsdom
// Garde de navigation avec un vrai routeur de données React Router (createMemoryRouter) dans un DOM jsdom.
import { act, createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useUnsavedWarning } from './useUnsavedWarning.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function Screen() {
  const [dirty, setDirty] = useState(false)
  const leaveDialog = useUnsavedWarning(dirty)
  return h(
    'section',
    null,
    leaveDialog,
    h('h1', null, 'Écran A'),
    h('button', { type: 'button', onClick: () => setDirty(true) }, 'Modifier'),
    h('button', { type: 'button', onClick: () => setDirty(false) }, 'Enregistrer'),
    h(Link, { to: '/b' }, 'Aller à B'),
  )
}

let container
let root
let router

const dialog = () => document.querySelector('[role="alertdialog"]')
const button = (name) => [...document.querySelectorAll('button')].find((element) => element.textContent === name)
const click = async (element) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  })
}
const key = async (target, name, init = {}) => {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))
  })
}
const go = async (to) => {
  await act(async () => {
    await router.navigate(to)
  })
}
const flushTimers = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)))

beforeEach(async () => {
  container = document.createElement('div')
  document.body.append(container)
  router = createMemoryRouter(
    [
      { path: '/a', element: h(Screen) },
      { path: '/b', element: h('h1', null, 'Écran B') },
    ],
    { initialEntries: ['/a'] },
  )
  root = createRoot(container)
  await act(async () => root.render(h(RouterProvider, { router })))
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('useUnsavedWarning (navigation interne)', () => {
  it('sans modification : la navigation n’est pas retenue', async () => {
    await go('/b')
    expect(router.state.location.pathname).toBe('/b')
    expect(dialog()).toBeNull()
  })

  it('avec modification : la navigation est retenue et un dialogue accessible s’ouvre, focus sur « Rester sur la page »', async () => {
    await click(button('Modifier'))
    await go('/b')
    expect(router.state.location.pathname).toBe('/a')
    const element = dialog()
    expect(element).not.toBeNull()
    expect(element.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(element.getAttribute('aria-labelledby')).textContent).toBe('Quitter sans enregistrer ?')
    expect(document.getElementById(element.getAttribute('aria-describedby')).textContent).toMatch(/ne sont pas enregistrées/)
    expect(element.hasAttribute('open')).toBe(true)
    expect(document.activeElement).toBe(button('Rester sur la page'))
  })

  it('Tab et Maj+Tab restent piégés entre les deux boutons', async () => {
    await click(button('Modifier'))
    await go('/b')
    await key(document.activeElement, 'Tab')
    expect(document.activeElement).toBe(button('Quitter sans enregistrer'))
    await key(document.activeElement, 'Tab')
    expect(document.activeElement).toBe(button('Rester sur la page'))
    await key(document.activeElement, 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(button('Quitter sans enregistrer'))
  })

  it('Échap = rester : dialogue fermé, on reste sur l’écran, focus rendu au lien d’origine', async () => {
    await click(button('Modifier'))
    const link = [...document.querySelectorAll('a')].find((element) => element.textContent === 'Aller à B')
    link.focus()
    await click(link)
    expect(dialog()).not.toBeNull()
    await key(document.activeElement, 'Escape')
    await flushTimers()
    expect(dialog()).toBeNull()
    expect(router.state.location.pathname).toBe('/a')
    expect(document.activeElement).toBe(link)
  })

  it('« Rester sur la page » ferme le dialogue sans naviguer ; une nouvelle tentative le rouvre', async () => {
    await click(button('Modifier'))
    await go('/b')
    await click(button('Rester sur la page'))
    expect(dialog()).toBeNull()
    expect(router.state.location.pathname).toBe('/a')
    await go('/b')
    expect(dialog()).not.toBeNull()
  })

  it('« Quitter sans enregistrer » poursuit la navigation', async () => {
    await click(button('Modifier'))
    await go('/b')
    await click(button('Quitter sans enregistrer'))
    expect(router.state.location.pathname).toBe('/b')
    expect(dialog()).toBeNull()
  })

  it('après un enregistrement réussi (plus de modification), la navigation est libre', async () => {
    await click(button('Modifier'))
    await click(button('Enregistrer'))
    await go('/b')
    expect(router.state.location.pathname).toBe('/b')
    expect(dialog()).toBeNull()
  })

  it('une navigation sur le même écran (ancre) n’est pas retenue', async () => {
    await click(button('Modifier'))
    await go('/a#section')
    expect(router.state.location.hash).toBe('#section')
    expect(dialog()).toBeNull()
  })
})
