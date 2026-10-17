import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorMessage, Modal, Textarea } from '../../core'
import { NO_PURCHASE_REASONS, validNoPurchase } from '../../customers'
import type { NoPurchaseReason } from '../../customers'
import { useNoPurchaseWrite } from '../hooks/useNoPurchaseWrite'

/** `blocked`: hay una visita de este cliente guardada en el celular; no se abre otra. */
export function NoPurchaseAction({ customerId, customerName, blocked = false }: { customerId: string; customerName: string; blocked?: boolean }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<NoPurchaseReason | null>(null)
  const [notes, setNotes] = useState('')
  const write = useNoPurchaseWrite(customerId, customerName)
  const back = () => { if (!write.isPending) { write.correct(); setOpen(false) } }
  async function confirm() {
    if (!reason || !validNoPurchase(reason, notes)) return
    // Confirmado o guardado en el celular (se envía solo): en los dos casos se sigue el recorrido.
    if (await write.send(reason, notes) !== 'error') navigate('/reparto')
  }
  return <>
    <Button variant="danger" className="min-h-14" disabled={blocked && !open} onClick={() => setOpen(true)}>No compró</Button>
    {open && <Modal title="¿Por qué no compró?" onClose={back} busy={write.isPending} footer={<>
      <Button variant="danger" disabled={write.isPending} onClick={back}>Volver</Button>
      <Button disabled={write.isPending || !validNoPurchase(reason, notes)} onClick={() => { void confirm() }}>
        {write.isPending ? 'Guardando…' : 'Confirmar'}
      </Button>
    </>}>
      <p className="text-lg font-semibold">{customerName}</p>
      <fieldset disabled={write.locked} className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Elegí un motivo</legend>
        {(Object.entries(NO_PURCHASE_REASONS) as [NoPurchaseReason, string][]).map(([value, label]) =>
          <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded border p-3 text-base ${reason === value ? 'border-accent bg-accent-soft' : 'border-line'}`}>
            <input type="radio" name="no-purchase-reason" value={value} checked={reason === value}
              onChange={() => setReason(value)} className="h-5 w-5 accent-brand" />
            {label}
          </label>)}
      </fieldset>
      <Textarea label={reason === 'Other' ? 'Nota (obligatoria)' : 'Nota (opcional)'}
        required={reason === 'Other'} maxLength={300} rows={3} value={notes} disabled={write.locked}
        onChange={(event) => setNotes(event.target.value)} />
      <p className="text-sm text-muted">{notes.length}/300 caracteres</p>
      <ErrorMessage error={write.error} />
      {write.canCorrect && <Button variant="secondary" onClick={write.correct}>Corregir datos</Button>}
    </Modal>}
  </>
}
