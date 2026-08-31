import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, Button, Field, formatMoney } from '../../core'
import { sessionService } from '../services/sessionService'

/**
 * La liquidacion de la salida. Muestra las tres cifras separadas, que no son la
 * misma cosa: vendido menos cobrado es deuda nueva y es normal; cobrado menos
 * entregado es plata que se cobro y no llego. Mezclarlas haria ver un problema de
 * caja donde solo hay una venta a cuenta.
 */
export function SettlementPanel({ sessionId, cerrada }: { sessionId: string; cerrada: boolean }) {
  const queryClient = useQueryClient()

  const liquidacion = useQuery({
    queryKey: ['sessions', 'settlement', sessionId],
    queryFn: () => sessionService.getSettlement(sessionId),
  })

  const rendir = useMutation({
    mutationFn: (monto: number) => sessionService.registerSettlement(sessionId, monto, null),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sessions', 'settlement', sessionId] }),
  })

  const [monto, setMonto] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (liquidacion.isLoading) return <p className="text-sm text-slate-500">Cargando liquidación...</p>
  if (!liquidacion.data) return null

  const l = liquidacion.data

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await rendir.mutateAsync(Number(monto))
    } catch (err) {
      setError(err instanceof ApiError ? (err.detail ?? err.title) : 'No se pudo registrar.')
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-slate-700">Liquidación</h3>

      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Vendió</span>
          <span className="text-slate-900">{formatMoney(l.totalSold)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-slate-600">Cobró</span>
          <span className="text-slate-900">{formatMoney(l.totalCollected)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-100 pt-1">
          <span className="text-slate-600">Quedó a cuenta</span>
          <span className="text-slate-900">{formatMoney(l.newDebt)}</span>
        </div>

        {l.amountReceived === null ? (
          <p className="mt-2 text-xs text-slate-500">Todavía no se rindió.</p>
        ) : (
          <>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-600">Entregó</span>
              <span className="text-slate-900">{formatMoney(l.amountReceived)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-600">Diferencia de caja</span>
              <span
                className={
                  l.cashDifference === 0 ? 'font-medium text-emerald-700' : 'font-medium text-red-700'
                }
              >
                {formatMoney(l.cashDifference ?? 0)}
              </span>
            </div>
          </>
        )}
      </div>

      {l.amountReceived === null && cerrada && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={rendir.isPending}>
            {rendir.isPending ? 'Registrando...' : 'Registrar rendición'}
          </Button>
        </form>
      )}

      {l.amountReceived === null && !cerrada && (
        <p className="text-xs text-slate-500">
          Se rinde cuando el chofer volvió y cerró la salida.
        </p>
      )}
    </section>
  )
}
