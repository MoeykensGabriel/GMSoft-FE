import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Field, Panel, formatMoney } from '../../core'
import { OutsideWorkingHoursBadge } from '../../workingHours'
import { sessionService } from '../services/sessionService'
import { StatTile } from '../../core'
import { cashGapDetail } from '../utils/receptionSummary'
import { SettlementConfirmModal } from './SettlementConfirmModal'

export interface CollectedByMethod { cash: number; transfer: number; card: number }

/**
 * La liquidacion de la salida. Muestra las tres cifras separadas, que no son la
 * misma cosa: vendido menos cobrado es deuda nueva y es normal; cobrado menos
 * entregado es plata que se cobro y no llego. Mezclarlas haria ver un problema de
 * caja donde solo hay una venta a cuenta.
 */
export function SettlementPanel({ sessionId, driverName, cerrada, byMethod }: {
  sessionId: string
  driverName: string
  cerrada: boolean
  /** Cobrado por forma de pago, si quien lo usa ya lo tiene calculado. */
  byMethod?: CollectedByMethod
}) {
  const queryClient = useQueryClient()

  const liquidacion = useQuery({
    queryKey: ['sessions', 'settlement', sessionId],
    queryFn: () => sessionService.getSettlement(sessionId),
  })

  const rendir = useMutation({
    mutationFn: (monto: number) => sessionService.registerSettlement(sessionId, monto, null),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const [monto, setMonto] = useState('')
  // Enviar el formulario solo abre el resumen: registra recién el botón verde del modal.
  const [review, setReview] = useState(false)
  const closeReview = () => { if (!rendir.isPending) { setReview(false); rendir.reset() } }

  if (liquidacion.isLoading) return <p className="text-sm text-muted">Cargando liquidación...</p>
  if (!liquidacion.data) return null

  const l = liquidacion.data
  const diferencia = l.cashDifference ?? 0

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setReview(true)
  }

  return (
    <Panel title="Liquidación">
      {l.receivedAt && <OutsideWorkingHoursBadge marked={l.isOutsideWorkingHours} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Vendió" value={formatMoney(l.totalSold)} />
        <StatTile label="Cobró" value={formatMoney(l.totalCollected)} />
        <StatTile label="Quedó a cuenta" value={formatMoney(l.newDebt)} tone={l.newDebt > 0 ? 'warning' : 'neutral'}
          detail={l.newDebt > 0 ? 'Ventas sin cobrar en esta salida' : 'Nada quedó debiendo'} />
      </div>

      {byMethod && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Efectivo" value={formatMoney(byMethod.cash)} detail="Lo que tiene que entregar el chofer" />
          <StatTile label="Transferencia" value={formatMoney(byMethod.transfer)} tone={byMethod.transfer > 0 ? 'info' : 'neutral'}
            detail="No pasa por el chofer" />
          <StatTile label="Tarjeta" value={formatMoney(byMethod.card)} tone={byMethod.card > 0 ? 'info' : 'neutral'}
            detail="No pasa por el chofer" />
        </div>
      )}

      {l.amountReceived !== null && (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Entregó" value={formatMoney(l.amountReceived)} />
          <StatTile label="Diferencia de caja" value={formatMoney(Math.abs(diferencia))}
            tone={diferencia === 0 ? 'success' : 'danger'}
            detail={cashGapDetail(diferencia)} />
        </div>
      )}

      {l.amountReceived === null && cerrada && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded border border-warning/40 bg-warning-soft p-4">
          <p className="text-base font-semibold text-ink">Falta rendir el efectivo de esta salida.</p>
          <Field
            label="Cuánta plata llegó"
            name="amountReceived"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
          <Button type="submit" className="self-start" disabled={review}>Registrar rendición</Button>
        </form>
      )}

      {review && (
        <SettlementConfirmModal driverName={driverName} cashCollected={byMethod?.cash} amount={Number(monto)}
          sending={rendir.isPending} error={rendir.error} onBack={closeReview}
          onConfirm={() => rendir.mutate(Number(monto), { onSuccess: () => setReview(false) })} />
      )}

      {l.amountReceived === null && !cerrada && (
        <p className="text-sm text-muted">
          Todavía no se rindió. Se rinde cuando el chofer volvió y se recibió el camión.
        </p>
      )}
    </Panel>
  )
}
