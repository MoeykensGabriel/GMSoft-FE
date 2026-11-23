import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Modal, QuantityInput, Textarea } from '../../core'
import { inspectionService } from '../services/inspectionService'
import type { InspectionCustomer, InspectionRoute, NotBuyingReason } from '../services/inspectionService'
import { NOT_BUYING_REASONS } from '../utils/inspectionStatus'

/**
 * El control de un cliente: cuántos envases tiene de verdad y si sigue comprando. Al
 * guardar, el saldo de envases se corrige en el momento.
 */
export function CustomerInspectionModal({ sessionId, customer, onClose }: {
  sessionId: string; customer: InspectionCustomer; onClose: () => void
}) {
  const client = useQueryClient()
  const [counts, setCounts] = useState<Record<string, number>>(() => Object.fromEntries(
    customer.containers.map((c) => [c.productId, c.quantity])))
  const [stillBuys, setStillBuys] = useState<boolean | null>(customer.inspection?.stillBuys ?? null)
  const [reason, setReason] = useState<NotBuyingReason | null>(customer.inspection?.notBuyingReason ?? null)
  const [notes, setNotes] = useState(customer.inspection?.notes ?? '')
  const save = useMutation({
    mutationFn: () => inspectionService.save(sessionId, customer.id, {
      containers: customer.containers.map((c) => ({ productId: c.productId, realQuantity: counts[c.productId] ?? 0 })),
      stillBuys: stillBuys!, notBuyingReason: stillBuys ? null : reason, notes: notes.trim() || null,
    }),
    onSuccess: (updated) => {
      client.setQueryData<InspectionRoute>(['inspections', 'route', sessionId], (route) => route && {
        ...route, customers: route.customers.map((c) => c.id === updated.id ? updated : c),
      })
      onClose()
    },
  })
  const ready = stillBuys === true || (stillBuys === false && reason !== null && (reason !== 'Other' || notes.trim().length > 0))
  const changed = customer.containers.filter((c) => (counts[c.productId] ?? 0) !== c.quantity)

  return <Modal title={customer.displayName} onClose={onClose} busy={save.isPending} footer={<>
    <Button variant="danger" onClick={onClose} disabled={save.isPending}>Cancelar</Button>
    <Button onClick={() => save.mutate()} disabled={!ready || save.isPending}>{save.isPending ? 'Guardando...' : 'Guardar control'}</Button>
  </>}>
    <p className="text-sm text-muted">{customer.address}</p>
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">¿Cuántos envases tiene?</h3>
      {customer.containers.length === 0 && <p className="text-sm text-muted">No hay productos con envase por saldo.</p>}
      {customer.containers.map((c) => <QuantityInput key={c.productId} label={c.product} value={counts[c.productId] ?? 0}
        max={999} onChange={(value) => setCounts((prev) => ({ ...prev, [c.productId]: value }))}
        tone={(counts[c.productId] ?? 0) !== c.quantity ? 'danger' : undefined}
        description={`Sistema: ${c.quantity}`} />)}
      {changed.length > 0 && <p className="text-sm font-semibold text-orange-600">Se corrige el saldo de {changed.map((c) => c.product).join(', ')}.</p>}
    </section>
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">¿Sigue comprando?</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={stillBuys === true ? 'primary' : 'secondary'} aria-pressed={stillBuys === true} onClick={() => setStillBuys(true)}>Sí compra</Button>
        <Button variant={stillBuys === false ? 'danger' : 'secondary'} aria-pressed={stillBuys === false} onClick={() => setStillBuys(false)}>No compra</Button>
      </div>
      {stillBuys === false && <div className="grid grid-cols-2 gap-2" role="group" aria-label="Por qué no compra">
        {(Object.keys(NOT_BUYING_REASONS) as NotBuyingReason[]).map((key) =>
          <Button key={key} variant={reason === key ? 'warning' : 'secondary'} aria-pressed={reason === key}
            onClick={() => setReason(key)}>{NOT_BUYING_REASONS[key]}</Button>)}
      </div>}
    </section>
    <Textarea label={reason === 'Other' && stillBuys === false ? 'Nota (obligatoria)' : 'Nota (opcional)'} name="notes"
      maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
    <ErrorMessage error={save.error} />
  </Modal>
}
