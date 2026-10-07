import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  /** Cerrar sin confirmar: Escape, clic afuera o el boton de volver. */
  onClose: () => void
  /** Mientras se envia no se puede cerrar: la respuesta tiene que tener donde mostrarse. */
  busy?: boolean
  children: ReactNode
  /** Los botones. Verde para confirmar, rojo para cancelar o deshacer. */
  footer: ReactNode
}

/**
 * Modal pequeño de confirmacion. No registra nada por si mismo: abrirlo o cerrarlo
 * no tiene efectos, y quien lo usa decide que pasa al confirmar.
 */
export function Modal({ title, onClose, busy = false, children, footer }: Props) {
  const titleId = useId()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-md border border-neutral-900 bg-white p-5"
      >
        <h2 id={titleId} className="text-lg font-semibold text-neutral-900">{title}</h2>
        {children}
        <div className="flex flex-wrap justify-end gap-2">{footer}</div>
      </div>
    </div>
  )
}
