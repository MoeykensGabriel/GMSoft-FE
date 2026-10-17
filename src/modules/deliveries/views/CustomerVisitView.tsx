import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorMessage, LinkButton, Page, useOutbox } from '../../core'
import { useAuth } from '../../auth'
import { customerService, CustomerProfileCard, CustomerBalanceCard, CustomerAccountMovements, CustomerContainersSummary, routeLaterStorage } from '../../customers'
import { useCurrentSession } from '../../sessions'
import { NoPurchaseAction } from '../components/NoPurchaseAction'
import { RemovalAction } from '../components/RemovalAction'

export function CustomerVisitView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const bandeja = useOutbox(user?.userId ?? '')
  const session = useCurrentSession()
  const [panel, setPanel] = useState<'containers' | 'account' | null>(null)
  const customer = useQuery({ queryKey: ['customers', 'detail', id], queryFn: () => customerService.getById(id!), enabled: Boolean(id && session.data) })
  const account = useQuery({ queryKey: ['customers', 'account', id], queryFn: () => customerService.getAccount(id!), enabled: Boolean(id && session.data), staleTime: 0 })
  const guardada = bandeja.find((item) => item.customerId === id && item.sessionId === session.data?.id && item.status === 'pending')
  const valid = customer.data?.isActive && customer.data.zoneId === session.data?.zoneId
    && customer.data.vehicleId === session.data?.vehicleId
    && customer.data.visitDays?.some((day) => session.data?.routeDays.includes(day))

  return <Page className="mx-auto flex max-w-md flex-col gap-4 p-3">
    <LinkButton to="/reparto" variant="navigation">← Menú principal</LinkButton>
    {session.isPending ? <p>Cargando salida…</p> : session.isError ? <ErrorMessage error={session.error} /> : !session.data ? <p>No tenés una salida abierta.</p>
      : customer.isPending || account.isPending ? <p role="status">Cargando cliente…</p>
      : customer.isError || account.isError ? <div className="flex flex-col gap-3"><ErrorMessage error={customer.error ?? account.error} /><Button variant="secondary" onClick={() => { void customer.refetch(); void account.refetch() }}>Reintentar</Button></div>
      : !valid ? <p role="alert">Este cliente no pertenece al camión, zona y días de tu recorrido.</p>
      : <>
        <CustomerProfileCard customer={customer.data!} />
        <p className="text-sm"><strong>Envases prestados:</strong> <CustomerContainersSummary account={account.data!} /></p>
        <CustomerBalanceCard balance={account.data!.balance} />
        <div className="grid grid-cols-2 gap-2">
          <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.data!.address + ', ' + (customer.data!.zoneName ?? ''))}`}
            className="ui-card flex min-h-14 items-center justify-center p-3 text-center text-sm font-medium text-brand hover:bg-accent-soft">Ver dirección en mapa</a>
          <Button variant="secondary" onClick={() => setPanel(panel === 'containers' ? null : 'containers')} aria-expanded={panel === 'containers'} aria-controls="customer-containers">Envases prestados</Button>
          <Button variant="secondary" className="col-span-2" onClick={() => setPanel(panel === 'account' ? null : 'account')} aria-expanded={panel === 'account'} aria-controls="customer-account">Detalle de deuda</Button>
        </div>
        {panel === 'containers' && <section id="customer-containers" className="ui-card p-3 text-sm"><h2 className="mb-2 font-semibold">Envases en poder del cliente</h2><CustomerContainersSummary account={account.data!} /></section>}
        {panel === 'account' && <div id="customer-account"><CustomerAccountMovements account={account.data!} /></div>}
        {/* Una visita de este cliente guardada en el celular: otra podría duplicarla si la primera llegó. */}
        {guardada && <p role="alert" className="rounded border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
          Hay una visita de este cliente guardada en el celular, enviándose: {guardada.label}. No la cargues de nuevo.
        </p>}
        {/* Los dos del mismo tamaño en la misma fila: no compró hoy (rojo) o no va a comprar más (negro). */}
        <div className="grid grid-cols-2 gap-2">
          <NoPurchaseAction key={id} customerId={id!} customerName={customer.data!.displayName} blocked={Boolean(guardada)} />
          <RemovalAction key={`baja-${id}`} customerId={id!} customerName={customer.data!.displayName} account={account.data!} />
        </div>
        {/* No lo saca del recorrido: lo manda al final de la hoja de hoy. */}
        <Button variant="secondary" className="min-h-14" onClick={() => { routeLaterStorage.postpone(session.data!.id, id!); navigate('/reparto') }}>
          Visitar más tarde
        </Button>
        {!guardada && <LinkButton to={`/reparto/visita?customerId=${encodeURIComponent(id!)}`} variant="primary" className="min-h-14">Realizar venta</LinkButton>}
      </>}
  </Page>
}
