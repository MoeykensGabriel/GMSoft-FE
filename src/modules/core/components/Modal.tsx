import { useEffect, useId, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-modal="true" aria-busy={busy} className="ui-dialog"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}>
      <h2 id={titleId} className="border-b border-brand bg-brand px-4 py-3 text-base font-semibold text-white">{title}</h2>
      <div className="flex flex-col gap-4 p-4">{children}</div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas p-4">{footer}</div>
    </dialog>
  )
}
