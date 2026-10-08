import type { ReactNode } from 'react'
import { Button, ErrorMessage, Modal } from '../../core'

export function WriteConfirmation({ title, busy, locked, error, canCorrect, onCorrect, onClose, onConfirm, children }: {
  title: string; busy: boolean; locked: boolean; error: unknown; canCorrect: boolean
  onCorrect: () => void; onClose: () => void; onConfirm: () => void; children: ReactNode
}) {
  return <Modal title={title} busy={busy} onClose={onClose} footer={<>
    <Button type="button" variant="danger" disabled={busy} onClick={onClose}>Volver</Button>
    {canCorrect && <Button type="button" variant="secondary" disabled={busy} onClick={onCorrect}>Corregir datos</Button>}
    <Button type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Enviando...' : locked ? 'Reintentar el mismo envío' : title}</Button>
  </>}>
    {children}
    <ErrorMessage error={error} />
    {locked && Boolean(error) && <p role="status" className="text-sm">Conservamos los datos y la clave del envío. Reintentá desde acá para no duplicarlo. Si no recibimos respuesta, no inicies otra promoción ni otro cierre.</p>}
  </Modal>
}
