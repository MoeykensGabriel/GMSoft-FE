import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, ErrorMessage, Field, Modal } from '../../core'
import { customerService } from '../services/customerService'
import type { OutOfRouteCustomer } from '../services/customerService'
import { outOfRouteChip } from '../utils/outOfRoute'

export function OutOfRouteSearch({ sessionId, onConfirm }: { sessionId: string; onConfirm: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<OutOfRouteCustomer | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])
  const ready = search.trim().length >= 2 && search.trim() === debouncedSearch
  const customers = useQuery({
    queryKey: ['customers', 'out-of-route', sessionId, debouncedSearch],
    queryFn: () => customerService.searchOutOfRoute(debouncedSearch),
    enabled: ready,
    staleTime: 0,
  })
  return <section className="flex min-w-0 flex-col gap-3" aria-label="Pedidos">
    <div className="ui-card border-2 border-warning bg-surface p-3">
      <Field label="Buscar clientes" name="out-of-route-search" type="search" placeholder="Nombre, dirección o teléfono" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    {ready && <>
      {customers.isPending && <p role="status">Buscando…</p>}
      {customers.isError && <div><ErrorMessage error={customers.error} /><Button variant="secondary" onClick={() => void customers.refetch()}>Reintentar</Button></div>}
      {customers.isSuccess && customers.data.length === 0 && <p className="text-sm text-muted">Sin clientes con esa búsqueda.</p>}
      {!!customers.data?.length && <ul className="ui-card divide-y divide-line">
        {customers.data.map((customer) => <li key={customer.id}>
          <button type="button" className="flex min-h-11 w-full min-w-0 flex-col items-start gap-1 p-3 text-left break-words hover:bg-warning-soft" onClick={() => setSelected(customer)}>
            <span className="max-w-full font-semibold">{customer.name}</span>
            <span className="max-w-full text-sm text-muted">{customer.address}</span>
            <Badge tone="pedido">{outOfRouteChip(customer.visitDays, customer.zoneName)}</Badge>
          </button>
        </li>)}
      </ul>}
    </>}
    {selected && <Modal title="Venta fuera de su día" onClose={() => setSelected(null)} footer={<>
      <Button variant="secondary" className="min-h-11" onClick={() => setSelected(null)}>Cancelar</Button>
      <Button className="min-h-11" onClick={() => onConfirm(selected.id)}>Atenderlo hoy</Button>
    </>}>
      <p className="break-words font-semibold">{selected.name}</p>
      <div><Badge tone="pedido">{outOfRouteChip(selected.visitDays, selected.zoneName)}</Badge></div>
    </Modal>}
  </section>
}
