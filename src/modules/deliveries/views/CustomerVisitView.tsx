import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button, ErrorMessage } from '../../core'
import { customerService, CustomerProfileCard, CustomerBalanceCard, CustomerAccountMovements, CustomerContainersSummary } from '../../customers'
import { useCurrentSession, usePostponeVisit } from '../../sessions'

export function CustomerVisitView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const postpone = usePostponeVisit()
  const session = useCurrentSession()
  const [panel, setPanel] = useState<'containers' | 'account' | null>(null)
  const customer = useQuery({ queryKey: ['customers', 'detail', id], queryFn: () => customerService.getById(id!), enabled: Boolean(id && session.data) })
  const account = useQuery({ queryKey: ['customers', 'account', id], queryFn: () => customerService.getAccount(id!), enabled: Boolean(id && session.data), staleTime: 0 })
  const valid = customer.data?.isActive && customer.data.zoneId === session.data?.zoneId
  const deferred = id && session.data?.deferredCustomerIds?.includes(id)

  return <main className="mx-auto flex max-w-md flex-col gap-4 p-3">
    <Link to="/reparto" className="flex min-h-11 items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium">← Menú principal</Link>
    {session.isPending ? <p>Cargando salida…</p> : session.isError ? <ErrorMessage error={session.error} /> : !session.data ? <p>No tenés una salida abierta.</p>
      : customer.isPending || account.isPending ? <p role="status">Cargando cliente…</p>
      : customer.isError || account.isError ? <div className="flex flex-col gap-3"><ErrorMessage error={customer.error ?? account.error} /><Button variant="secondary" onClick={() => { void customer.refetch(); void account.refetch() }}>Reintentar</Button></div>
      : !valid ? <p role="alert">Este cliente no está activo en la zona de tu recorrido.</p>
      : <>
        <CustomerProfileCard customer={customer.data!} />
        {deferred && <p className="rounded-md border border-neutral-300 p-2 text-sm">Visita pendiente en esta salida.</p>}
        <p className="text-sm"><strong>Envases prestados:</strong> <CustomerContainersSummary account={account.data!} /></p>
        <CustomerBalanceCard balance={account.data!.balance} />
        <div className="grid grid-cols-2 gap-2">
          <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.data!.address + ', ' + (customer.data!.zoneName ?? ''))}`}
            className="flex min-h-14 items-center justify-center rounded-md border border-neutral-300 p-3 text-center text-sm font-medium">Ver dirección en mapa</a>
          <Button variant="secondary" onClick={() => setPanel(panel === 'containers' ? null : 'containers')} aria-expanded={panel === 'containers'} aria-controls="customer-containers">Envases prestados</Button>
          <Button variant="secondary" className="col-span-2" onClick={() => setPanel(panel === 'account' ? null : 'account')} aria-expanded={panel === 'account'} aria-controls="customer-account">Detalle de deuda</Button>
        </div>
        {panel === 'containers' && <section id="customer-containers" className="rounded-md border border-neutral-300 p-3 text-sm"><h2 className="mb-2 font-semibold">Envases en poder del cliente</h2><CustomerContainersSummary account={account.data!} /></section>}
        {panel === 'account' && <div id="customer-account"><CustomerAccountMovements account={account.data!} /></div>}
        <ErrorMessage error={postpone.error} />
        <Button variant="danger" className="min-h-14" disabled={postpone.isPending}
          onClick={() => { if (id) postpone.mutate(id, { onSuccess: () => navigate('/reparto') }) }}>
          {postpone.isPending ? 'Guardando…' : 'Posponer visita'}
        </Button>
        <p className="text-xs text-neutral-600">Quedará pendiente en este recorrido. Sus días habituales se conservan.</p>
        <Link to={`/reparto/visita?customerId=${encodeURIComponent(id!)}`} aria-disabled={postpone.isPending} onClick={(event) => { if (postpone.isPending) event.preventDefault() }} className="flex min-h-14 items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center text-base font-medium text-white hover:bg-green-800">Realizar venta</Link>
      </>}
  </main>
}
