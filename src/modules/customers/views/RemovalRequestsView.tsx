import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, Badge, Button, DataTable, ErrorMessage, Modal, Page, PageHeader, Pagination, formatDateTime, formatMoney } from '../../core'
import { customerService } from '../services/customerService'
import type { CustomerRemoval } from '../services/customerService'
import { removalLabel } from '../utils/removal'
import type { RemovalStatus } from '../utils/removal'

const REMOVALS_KEY = ['customers', 'removal-requests'] as const

const TABS: { value: RemovalStatus; label: string }[] = [
  { value: 'Pending', label: 'Pendientes' }, { value: 'Confirmed', label: 'Confirmadas' }, { value: 'Rejected', label: 'Rechazadas' },
]

/**
 * Bajas pedidas por los choferes. El cliente ya salió de la hoja del chofer; acá la
 * oficina confirma (queda inactivo, nunca se borra) o rechaza (vuelve a su lugar).
 */
export function RemovalRequestsView() {
  const cache = useQueryClient()
  const [status, setStatus] = useState<RemovalStatus>('Pending')
  const [page, setPage] = useState(1)
  const [review, setReview] = useState<{ removal: CustomerRemoval; confirm: boolean } | null>(null)
  const list = useQuery({ queryKey: [...REMOVALS_KEY, status, page], queryFn: () => customerService.removals(status, page) })
  const resolve = useMutation({
    mutationFn: ({ removal, confirm }: { removal: CustomerRemoval; confirm: boolean }) =>
      confirm ? customerService.confirmRemoval(removal.id) : customerService.rejectRemoval(removal.id),
    onSuccess: async () => {
      setReview(null)
      await cache.invalidateQueries({ queryKey: ['customers'] })
    },
  })
  const items = list.data?.items ?? []

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Bajas pedidas por los choferes"
      description="El cliente ya no aparece en la hoja del chofer. Confirmá la baja o rechazala para que vuelva a su recorrido." />
    <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la baja">
      {TABS.map((tab) => <Button key={tab.value} variant={status === tab.value ? 'navigation' : 'secondary'} aria-pressed={status === tab.value}
        onClick={() => { setStatus(tab.value); setPage(1) }}>
        {tab.label}{tab.value === 'Pending' && list.data ? ` (${list.data.pendingCount})` : ''}
      </Button>)}
    </div>

    {list.isPending ? <p role="status">Cargando bajas…</p>
      : list.isError ? <div className="flex flex-col items-start gap-2"><ErrorMessage error={list.error} /><Button variant="secondary" onClick={() => list.refetch()}>Reintentar</Button></div>
      : !items.length ? <p className="ui-card bg-surface p-3 text-sm text-muted">{status === 'Pending' ? 'No hay bajas pendientes.' : 'No hay bajas en este estado.'}</p>
      : <DataTable label="Bajas pedidas por los choferes" className="min-w-[56rem]">
        <thead><tr><th scope="col">Cliente</th><th scope="col">Recorrido</th><th scope="col">Motivo</th><th scope="col">Envases</th><th scope="col">Deuda</th><th scope="col">Pedida</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{items.map((removal) => <tr key={removal.id}>
          <td><Link to={`/panel/clientes/${encodeURIComponent(removal.customerId)}`} className="font-semibold underline">{removal.customerName}</Link></td>
          <td>{removal.vehicleName}<span className="block text-xs text-muted">{removal.zoneName} · {removal.driverName}</span></td>
          <td>{removalLabel(removal.reason)}{removal.notes && <span className="block text-xs text-muted">{removal.notes}</span>}</td>
          <td>{removal.containers.length ? <>
            {removal.containers.map((line) => <span key={line.productId} className="block">{line.quantity} × {line.productDetail}</span>)}
            {removal.containersNotReturned && <Badge tone="warning">No los devolvió</Badge>}
          </> : <span className="text-muted">Sin envases</span>}</td>
          <td className={removal.debt > 0 ? 'font-semibold text-warning' : 'text-muted'}>{removal.debt > 0 ? formatMoney(removal.debt) : 'Sin deuda'}</td>
          <td>{formatDateTime(removal.requestedAt, BUSINESS_TIME_ZONE)}
            {removal.resolvedAt && <span className="block text-xs text-muted">Resuelta {formatDateTime(removal.resolvedAt, BUSINESS_TIME_ZONE)}</span>}</td>
          <td>{removal.status === 'Pending' ? <div className="flex flex-wrap gap-2">
            <Button onClick={() => { resolve.reset(); setReview({ removal, confirm: true }) }}>Confirmar baja</Button>
            <Button variant="danger" onClick={() => { resolve.reset(); setReview({ removal, confirm: false }) }}>Rechazar</Button>
          </div> : <Badge tone={removal.status === 'Confirmed' ? 'neutral' : 'info'}>{removal.status === 'Confirmed' ? 'Confirmada' : 'Rechazada'}</Badge>}</td>
        </tr>)}</tbody>
      </DataTable>}

    {list.data && list.data.totalCount > list.data.pageSize && <Pagination page={page}
      totalPages={Math.ceil(list.data.totalCount / list.data.pageSize)} hasPreviousPage={page > 1}
      hasNextPage={page * list.data.pageSize < list.data.totalCount} onChange={setPage} />}

    {review && <Modal title={review.confirm ? 'Confirmar la baja' : 'Rechazar la baja'} busy={resolve.isPending}
      onClose={() => { if (!resolve.isPending) setReview(null) }} footer={<>
        <Button variant="danger" disabled={resolve.isPending} onClick={() => setReview(null)}>Volver</Button>
        <Button disabled={resolve.isPending} onClick={() => resolve.mutate(review)}>
          {resolve.isPending ? 'Guardando…' : review.confirm ? 'Confirmar baja' : 'Rechazar y devolver al recorrido'}
        </Button>
      </>}>
      <p className="text-lg font-semibold">{review.removal.customerName}</p>
      <p>{review.confirm
        ? 'El cliente queda inactivo. No se borra: conserva su historial, su cuenta y sus envases, y lo podés reactivar cuando quieras.'
        : 'El cliente vuelve a la hoja del chofer, en su lugar de siempre del recorrido.'}</p>
      {review.confirm && review.removal.containers.length > 0 && <p className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">
        Todavía tiene {review.removal.containers.reduce((sum, line) => sum + line.quantity, 0)} envases prestados.</p>}
      {review.confirm && review.removal.debt > 0 && <p className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">
        Debe {formatMoney(review.removal.debt)}.</p>}
      <ErrorMessage error={resolve.error} />
    </Modal>}
  </Page>
}

/** Aviso del Home: cuántas bajas esperan que la oficina las resuelva. */
export function RemovalRequestsNotice() {
  const pending = useQuery({ queryKey: [...REMOVALS_KEY, 'Pending', 1], queryFn: () => customerService.removals('Pending', 1), refetchInterval: 60_000 })
  const count = pending.data?.pendingCount ?? 0
  if (!count) return null
  return <div role="status" className="rounded border border-warning/40 bg-warning-soft p-4 text-warning">
    <p className="font-semibold">{count === 1 ? '1 baja pedida por un chofer' : `${count} bajas pedidas por los choferes`}</p>
    <p className="text-sm">Esos clientes ya no aparecen en la hoja. Confirmá o rechazá cada baja.</p>
    <Link className="underline" to="/panel/bajas">Revisar bajas pedidas</Link>
  </div>
}
