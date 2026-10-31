import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Field, Modal, formatMoney } from '../../core'
import type { PendingSettlement } from '../services/sessionService'
import { sessionService } from '../services/sessionService'
import { SettlementConfirmModal } from './SettlementConfirmModal'

/** Cargar la plata desde la lista de pendientes, sin ir a buscar el formulario al final de la salida. */
export function PendingSettlementModal({ item, onClose }: { item: PendingSettlement; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [monto, setMonto] = useState('')
  const [review, setReview] = useState(false)
  const rendir = useMutation({
    mutationFn: (amount: number) => sessionService.registerSettlement(item.sessionId, amount, null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onClose()
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setReview(true)
  }

  if (review) return <SettlementConfirmModal driverName={item.driverName} cashCollected={item.cashToDeliver}
    amount={Number(monto)} sending={rendir.isPending} error={rendir.error}
    onBack={() => { if (!rendir.isPending) { setReview(false); rendir.reset() } }}
    onConfirm={() => rendir.mutate(Number(monto))} />

  return <Modal title="Cargar la plata" onClose={onClose} footer={<>
    <Button type="button" variant="danger" onClick={onClose}>Cancelar</Button>
    <Button type="submit" form="cargar-plata">Seguir</Button>
  </>}>
    <p className="rounded border border-warning/40 bg-warning-soft p-3 font-semibold text-warning">
      {item.vehicleName} · {item.driverName}: {formatMoney(item.cashToDeliver)}
    </p>
    <form id="cargar-plata" onSubmit={onSubmit}>
      <Field label="Cuánta plata llegó" name="amountReceived" type="number" min={0} step="0.01" inputMode="decimal"
        required autoFocus value={monto} onChange={(event) => setMonto(event.target.value)} />
    </form>
  </Modal>
}
