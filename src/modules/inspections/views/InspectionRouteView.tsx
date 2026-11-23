import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Badge, BackButton, Button, ErrorMessage } from '../../core'
import { CustomerInspectionModal } from '../components/CustomerInspectionModal'
import { inspectionService } from '../services/inspectionService'
import type { InspectionCustomer } from '../services/inspectionService'
import { driverVisitLabel, inspectionTone, NOT_BUYING_REASONS, TONE_BORDER } from '../utils/inspectionStatus'

const ACTIVITY_TONE = { White: 'neutral', Red: 'danger', Black: 'danger' } as const

/** Los clientes del camión en orden de recorrido. Se toca uno para controlarlo. */
export function InspectionRouteView() {
  const { sessionId = '' } = useParams()
  const [open, setOpen] = useState<InspectionCustomer | null>(null)
  const route = useQuery({ queryKey: ['inspections', 'route', sessionId], queryFn: () => inspectionService.route(sessionId) })

  if (route.isPending) return <p className="text-muted">Cargando el recorrido...</p>
  if (route.isError) return <div className="flex flex-col gap-3"><ErrorMessage error={route.error} />
    <BackButton to="/control" label="Elegir otro camión" appearance="link" /></div>

  const { departure, customers } = route.data
  // Como en la app del chofer: arriba los que faltan, en orden de recorrido; abajo, aparte, los ya controlados.
  const pending = customers.filter((c) => !c.inspection)
  const done = customers.filter((c) => c.inspection)

  return <section className="flex flex-col gap-3">
    <BackButton to="/control" label="Cambiar de camión" appearance="link" />
    <header className="flex flex-col gap-1 rounded border border-brand bg-brand p-4 text-center text-white">
      <h1 className="text-lg font-semibold">{departure.vehicleName} · {departure.licensePlate}</h1>
      <p className="text-sm">Chofer: <strong>{departure.driverName}</strong></p>
      <p className="text-xs">{departure.zones.join(' → ')}</p>
    </header>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-semibold">{done.length} de {customers.length} controlados</p>
      <Button variant="secondary" onClick={() => route.refetch()} disabled={route.isFetching}>Actualizar</Button>
    </div>
    <ul className="flex flex-col gap-2" aria-label="Faltan controlar">
      {pending.map((c) => <li key={c.id}><CustomerCard customer={c} onOpen={() => setOpen(c)} /></li>)}
    </ul>
    {pending.length === 0 && <p className="text-muted">{customers.length === 0 ? 'Este camión no tiene clientes en el recorrido.' : 'Ya controlaste a todos los clientes de este camión.'}</p>}
    {done.length > 0 && <details className="ui-card p-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Ya controlados ({done.length})</summary>
      <ul className="flex flex-col gap-2">
        {done.map((c) => <li key={c.id}><CustomerCard customer={c} onOpen={() => setOpen(c)} /></li>)}
      </ul>
    </details>}
    {open && <CustomerInspectionModal sessionId={sessionId} customer={open} onClose={() => setOpen(null)} />}
  </section>
}

function CustomerCard({ customer, onOpen }: { customer: InspectionCustomer; onOpen: () => void }) {
  const tone = inspectionTone(customer)
  const visit = driverVisitLabel(customer)
  const done = customer.inspection
  return <button type="button" onClick={onOpen}
    className={`ui-card flex w-full flex-col gap-2 border-l-8 p-3 text-left hover:bg-accent-soft ${TONE_BORDER[tone]}`}>
    <span className="flex items-start justify-between gap-2">
      <span><span className="font-semibold">{customer.routeOrder}. {customer.displayName}</span>
        <span className="block text-sm text-muted">{customer.address}</span></span>
      <Badge tone={visit.tone}>{visit.text}</Badge>
    </span>
    <span className="flex flex-wrap gap-2 text-sm">
      {customer.containers.filter((c) => c.quantity !== 0).map((c) =>
        <span key={c.productId} className="rounded border border-line px-2 py-0.5">{c.product}: <strong>{c.quantity}</strong></span>)}
      {customer.containers.every((c) => c.quantity === 0) && <span className="text-muted">Sin envases</span>}
      {customer.weeksWithoutPurchase > 0 && <Badge tone={ACTIVITY_TONE[customer.activityStatus]}>
        {customer.weeksWithoutPurchase} {customer.weeksWithoutPurchase === 1 ? 'semana' : 'semanas'} sin comprar</Badge>}
    </span>
    {done && <span className="text-sm font-semibold">
      {done.stillBuys ? <span className="text-success-dark">✓ Compra</span>
        : <span className="text-danger">✗ No compra: {NOT_BUYING_REASONS[done.notBuyingReason ?? 'Other']}</span>}
      {tone === 'fixed' && <span className="text-orange-600"> · envases corregidos</span>}
    </span>}
  </button>
}
