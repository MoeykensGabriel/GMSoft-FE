import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ApiError, Button, ErrorMessage, LinkButton, Modal, Textarea, formatMoney, newRequestId } from '../../core'
import { customerService, REMOVAL_REASONS, validRemoval } from '../../customers'
import type { CustomerAccount, RemovalReason } from '../../customers'
import { SESION_ACTUAL } from '../../sessions'

/**
 * El chofer da de baja a un cliente que no va a comprar más. Sale de su hoja en el
 * momento; la oficina confirma o rechaza la baja. Si el cliente tiene envases, hay que
 * retirarlos primero o marcar que no los devolvió. La deuda no bloquea: solo se avisa.
 */
export function RemovalAction({ customerId, customerName, account }: {
  customerId: string; customerName: string; account: CustomerAccount
}) {
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<RemovalReason | null>(null)
  const [notes, setNotes] = useState('')
  const [notReturned, setNotReturned] = useState(false)
  // La misma clave en cada reintento: si la respuesta se pierde, no se pide dos veces.
  const requestId = useRef<string | null>(null)
  const containers = account.containers.filter((line) => line.quantity > 0)
  const units = account.units.length
  const hasContainers = containers.length > 0 || units > 0
  const write = useMutation({
    mutationFn: () => {
      requestId.current ??= newRequestId()
      return customerService.requestRemoval(customerId, {
        clientRequestId: requestId.current, reason: reason!, notes: notes.trim() || null, containersNotReturned: notReturned,
      })
    },
    retry: false,
    onSuccess: async () => {
      // La baja la hizo el propio chofer: sin esto, "La oficina actualizó tu recorrido" se dispararía al volver.
      cache.setQueriesData<string[]>({ queryKey: ['customers', 'route-membership'] }, (ids) => ids?.filter((id) => id !== customerId))
      await Promise.all([cache.invalidateQueries({ queryKey: ['customers'] }), cache.invalidateQueries({ queryKey: SESION_ACTUAL })])
      navigate('/reparto')
    },
  })
  const valid = validRemoval(reason, notes, hasContainers, notReturned)
  // Un rechazo de validación permite corregir con una clave nueva; otro error conserva la misma.
  const editable = !write.isPending && !(write.isError && !(write.error instanceof ApiError && [400, 409].includes(write.error.status)))
  const close = () => { if (!write.isPending) { setOpen(false); write.reset(); requestId.current = null } }

  return <>
    <Button variant="dark" className="min-h-14" onClick={() => setOpen(true)}>Dar de baja</Button>
    {open && <Modal title="Dar de baja al cliente" onClose={close} busy={write.isPending} footer={<>
      <Button variant="danger" disabled={write.isPending} onClick={close}>Volver</Button>
      <Button disabled={!valid || write.isPending} onClick={() => {
        // Tras un rechazo (400/409) el chofer corrige y es un envío nuevo; tras una respuesta incierta, el mismo.
        if (write.isError && editable) requestId.current = null
        write.mutate()
      }}>
        {write.isPending ? 'Dando de baja…' : 'Confirmar baja'}
      </Button>
    </>}>
      <p className="text-lg font-semibold">{customerName}</p>

      <section className={`rounded border p-3 ${hasContainers ? 'border-warning/40 bg-warning-soft' : 'border-line bg-canvas'}`} aria-label="Envases del cliente">
        {hasContainers ? <>
          <p className="font-semibold">Tiene envases prestados:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {containers.map((line) => <li key={line.productId} className="flex justify-between gap-3">
              <span>{line.productDetail}</span><span className="font-semibold">{line.quantity}</span>
            </li>)}
            {units > 0 && <li className="flex justify-between gap-3"><span>Dispensers</span><span className="font-semibold">{units}</span></li>}
          </ul>
          <p className="mt-2 text-sm">Retiralos antes de darlo de baja. Si no los devuelve, marcalo abajo.</p>
          <LinkButton to={`/reparto/visita?customerId=${encodeURIComponent(customerId)}`} variant="secondary" className="mt-2 w-full">Retirar envases primero</LinkButton>
          <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notReturned} onChange={(event) => setNotReturned(event.target.checked)} className="h-5 w-5 accent-brand" disabled={!editable} />
            No devolvió los envases
          </label>
        </> : <p>No tiene envases prestados.</p>}
      </section>

      {account.balance > 0 && <p role="status" className="rounded border border-warning/40 bg-warning-soft p-3 font-semibold text-warning">
        Debe {formatMoney(account.balance)}. La baja queda registrada con la deuda.
      </p>}

      <fieldset disabled={!editable} className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">¿Por qué se da de baja?</legend>
        {(Object.entries(REMOVAL_REASONS) as [RemovalReason, string][]).map(([value, label]) =>
          <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded border p-3 text-base ${reason === value ? 'border-accent bg-accent-soft' : 'border-line'}`}>
            <input type="radio" name="removal-reason" value={value} checked={reason === value}
              onChange={() => setReason(value)} className="h-5 w-5 accent-brand" />
            {label}
          </label>)}
      </fieldset>
      <Textarea label={reason === 'Other' ? 'Nota (obligatoria)' : 'Nota (opcional)'} required={reason === 'Other'}
        maxLength={300} rows={2} value={notes} disabled={!editable} onChange={(event) => setNotes(event.target.value)} />

      <p className="text-sm text-muted">El cliente sale de tu recorrido ahora. La oficina confirma la baja.</p>
      <ErrorMessage error={write.error} />
      {write.isError && !editable && <p role="status">No pudimos confirmar el resultado. Reintentá con Confirmar baja; conservamos el mismo envío.</p>}
    </Modal>}
  </>
}
