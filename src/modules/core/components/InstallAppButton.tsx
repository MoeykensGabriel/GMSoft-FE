import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

/** El aviso de instalación de Chrome y Edge; no está en los tipos de TypeScript. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// El navegador avisa una sola vez y apenas carga la página, a veces antes de que se
// dibuje el botón: se escucha desde que se importa el módulo y se guarda el aviso.
let pending: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    pending = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => { pending = null; notify() })
  // Sin service worker algunos Chrome y Edge no ofrecen instalar. Ver public/sw.js.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

// iPadOS se presenta como Mac: se distingue por la pantalla táctil.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

function ShareIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" className="inline align-text-bottom text-accent">
    <path fill="currentColor" d="M12 2 7.5 6.5l1.4 1.4L11 5.8V15h2V5.8l2.1 2.1 1.4-1.4L12 2Zm-7 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9h-2v9H7v-9H5Z" />
  </svg>
}

/**
 * Instala el sistema como app, con su ícono en la pantalla de inicio. En Android y
 * Windows abre el aviso del navegador; en iPhone, donde Apple no lo permite desde un
 * botón, muestra cómo hacerlo. No aparece si ya está instalada o si el navegador no
 * lo admite.
 */
export function InstallAppButton({ className = '' }: { className?: string }) {
  const prompt = useSyncExternalStore(subscribe, () => pending, () => null)
  const [installed, setInstalled] = useState(isInstalled)
  const [iosHelp, setIosHelp] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const update = () => setInstalled(isInstalled())
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (installed) return null

  if (prompt) {
    return <Button type="button" variant="secondary" className={className} onClick={async () => {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      // El aviso sirve una sola vez; si lo rechazó, el navegador vuelve a ofrecerlo más adelante.
      pending = null
      notify()
      if (outcome === 'accepted') setInstalled(true)
    }}>Instalar app</Button>
  }

  if (!isIos()) return null

  return <>
    <Button type="button" variant="secondary" className={className} onClick={() => setIosHelp(true)}>Instalar app</Button>
    {iosHelp && (
      <Modal title="Instalar en el iPhone" onClose={() => setIosHelp(false)}
        footer={<Button type="button" onClick={() => setIosHelp(false)}>Entendido</Button>}>
        <ol className="flex list-decimal flex-col gap-3 pl-5">
          <li>Abrí esta página en <strong>Safari</strong>.</li>
          <li>Tocá <strong>Compartir</strong> <ShareIcon />, abajo en el centro.</li>
          <li>Elegí <strong>Agregar a inicio</strong> y después <strong>Agregar</strong>.</li>
        </ol>
        <p className="text-muted">Va a aparecer el ícono de Villa Esperanza en tu pantalla de inicio.</p>
      </Modal>
    )}
  </>
}
