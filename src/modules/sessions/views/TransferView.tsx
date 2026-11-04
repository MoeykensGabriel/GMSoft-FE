import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Modal, Page, PageHeader, QuantityInput, Select, sortProducts } from '../../core'
import { sessionService } from '../services/sessionService'
import { describeTransfer, transferableStock, transferLines } from '../utils/transfer'

/**
 * Pase de llenos entre dos camiones en la calle. Un pase va en un solo sentido: si los
 * dos se pasan algo, al terminar está «Hacer el pase al revés».
 */
export function TransferView() {
  const cache = useQueryClient()
  const departures = useQuery({ queryKey: ['sessions', 'active-departures'], queryFn: sessionService.getActiveDepartures })
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [review, setReview] = useState(false)
  const pass = useMutation({
    mutationFn: () => sessionService.transferStock(fromId, toId, lines.map(({ productId, quantity }) => ({ productId, quantity }))),
    retry: false,
    onSuccess: async () => { setReview(false); await cache.invalidateQueries({ queryKey: ['sessions'] }) },
  })

  const trucks = departures.data ?? []
  const from = trucks.find((truck) => truck.sessionId === fromId)
  const to = trucks.find((truck) => truck.sessionId === toId)
  const stock = sortProducts(transferableStock(from?.stock), (line) => line.productDetail)
  const lines = transferLines(stock, quantities)
  const label = (truck: typeof trucks[number]) => `${truck.vehicleName} · ${truck.driverName}`

  function start(nextFrom: string, nextTo: string) {
    setFromId(nextFrom); setToId(nextTo); setQuantities({}); setReview(false); pass.reset()
  }

  if (pass.isSuccess && pass.data) return <Page className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Pase entre camiones" />
    <p role="status" className="rounded border border-success bg-success-soft p-4 text-lg font-semibold text-success-dark">
      Listo: {pass.data.fromVehicle} le pasó {describeTransfer(pass.data.lines)} a {pass.data.toVehicle}.
    </p>
    <div className="flex flex-wrap gap-3">
      <Button variant="navigation" onClick={() => start(toId, fromId)}>Hacer el pase al revés</Button>
      <Button variant="secondary" onClick={() => start('', '')}>Hacer otro pase</Button>
    </div>
  </Page>

  return <Page className="mx-auto flex max-w-5xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Pase entre camiones" />
    {departures.isError ? <div className="flex flex-col items-start gap-2">
      <ErrorMessage error={departures.error} />
      <Button variant="secondary" onClick={() => void departures.refetch()}>Reintentar</Button>
    </div> : departures.isPending ? <p role="status">Cargando camiones…</p> : trucks.length < 2 ? (
      <p className="ui-card bg-surface p-3 text-sm text-muted">Hacen falta dos camiones en la calle para hacer un pase.</p>
    ) : <>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Select label="Pasa" value={fromId} onChange={(event) => start(event.target.value, toId === event.target.value ? '' : toId)}>
          <option value="">Elegí el camión que da</option>
          {trucks.map((truck) => <option key={truck.sessionId} value={truck.sessionId}>{label(truck)}</option>)}
        </Select>
        <span aria-hidden className="pb-2 text-center text-2xl font-bold text-brand max-sm:rotate-90">→</span>
        <Select label="Recibe" value={toId} onChange={(event) => { setToId(event.target.value); pass.reset() }}>
          <option value="">Elegí el camión que recibe</option>
          {trucks.filter((truck) => truck.sessionId !== fromId).map((truck) =>
            <option key={truck.sessionId} value={truck.sessionId}>{label(truck)}</option>)}
        </Select>
      </div>

      {from && (stock.length === 0
        ? <p className="ui-card bg-surface p-3 text-sm text-muted">{from.vehicleName} no tiene llenos a bordo.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stock.map((line) => <QuantityInput key={line.productId} label={line.productDetail} max={line.fullOnBoard}
            description={`A bordo: ${line.fullOnBoard}`} value={quantities[line.productId] ?? 0}
            onChange={(value) => setQuantities({ ...quantities, [line.productId]: value })} />)}
        </div>)}

      <Button className="self-end" disabled={!from || !to || lines.length === 0} onClick={() => setReview(true)}>Pasar</Button>
    </>}

    {review && from && to && <Modal title="Confirmar pase" busy={pass.isPending} onClose={() => { if (!pass.isPending) setReview(false) }} footer={<>
      <Button type="button" variant="danger" disabled={pass.isPending} onClick={() => setReview(false)}>Volver</Button>
      <Button type="button" disabled={pass.isPending} onClick={() => pass.mutate()}>{pass.isPending ? 'Pasando…' : 'Confirmar pase'}</Button>
    </>}>
      <p className="text-center text-xl font-semibold">{from.vehicleName} <span className="text-brand">→</span> {to.vehicleName}</p>
      <ul className="flex flex-col gap-1 rounded border border-line bg-surface p-3">
        {lines.map((line) => <li key={line.productId} className="flex justify-between gap-3">
          <span>{line.productDetail}</span><span className="font-semibold tabular-nums">{line.quantity}</span>
        </li>)}
      </ul>
      <p className="text-sm text-muted">Se descuenta de {from.vehicleName} y se suma a {to.vehicleName} ahora mismo.</p>
      <ErrorMessage error={pass.error} />
    </Modal>}
  </Page>
}
