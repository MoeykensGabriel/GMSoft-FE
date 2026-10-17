import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, Field } from '../../core'
import { customerService } from '../services/customerService'
import type { Customer } from '../services/customerService'
import type { NoPurchaseReason } from '../utils/noPurchase'
import { matchesSearch, splitRoute } from '../utils/routeLater'
import { CustomerCard } from './CustomerCard'

export function CustomerRouteList({ vehicleId, zoneId, routeDays, onSelect, noPurchaseReasons = {}, visitedCustomerIds = [], laterCustomerIds = [] }: {
  vehicleId: string
  zoneId: string
  routeDays: number[]
  noPurchaseReasons?: Record<string, NoPurchaseReason>
  /** Ya visitados en esta salida: salen de la lista de pendientes y quedan aparte. */
  visitedCustomerIds?: string[]
  /** Pidieron que vuelva más tarde: siguen en el recorrido, pero al final. */
  laterCustomerIds?: string[]
  onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])
  const customers = useInfiniteQuery({
    queryKey: ['customers', 'route', vehicleId, zoneId, routeDays, debouncedSearch],
    initialPageParam: 1,
    refetchOnWindowFocus: true,
    // Sin consulta periódica propia: RouteUpdateNotice ya vigila el recorrido y la
    // refresca cuando la oficina lo cambia; las ventas del chofer también la invalidan.
    queryFn: ({ pageParam }) => customerService.listByZone(zoneId, 20, pageParam, routeDays, debouncedSearch, vehicleId),
    getNextPageParam: (page) => page.hasNextPage ? page.page + 1 : undefined,
  })
  const loaded = customers.data?.pages.flatMap((page) => page.items) ?? []
  // Un pospuesto puede estar en una página todavía sin cargar: se lo trae aparte con la
  // misma consulta que la ficha (ya está en caché al tocar el botón). Si la oficina lo
  // sacó del recorrido, la API lo rechaza y no aparece.
  const missing = laterCustomerIds.filter((id) => !visitedCustomerIds.includes(id) && !loaded.some((customer) => customer.id === id))
  const extra = useQueries({ queries: missing.map((id) => ({
    queryKey: ['customers', 'detail', id], queryFn: () => customerService.getById(id), retry: false,
  })) })
  // Solo si sigue en este recorrido: una ficha guardada de antes puede ser de un cliente que la oficina movió.
  const inRoute = (customer: Customer) => customer.isActive && !customer.removalPending
    && customer.vehicleId === vehicleId && customer.zoneId === zoneId
    && Boolean(customer.visitDays?.some((day) => routeDays.includes(day)))
  const all = [...loaded, ...extra.flatMap((query) =>
    !query.isError && query.data && inRoute(query.data) && matchesSearch(query.data, debouncedSearch) ? [query.data] : [])]
  // La lista se va acortando con cada visita; el orden de recorrido no cambia.
  const { pending: list, later, visited } = splitRoute(all, visitedCustomerIds, laterCustomerIds)
  return (
    <section className="flex flex-col gap-3" aria-label="Clientes en orden de recorrido">
      <div className="ui-card bg-surface p-3">
        <Field label="Buscar clientes del recorrido" name="route-search" type="search" placeholder="Nombre, dirección o teléfono" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <p className="text-xs text-muted">Tocá un cliente para abrir su ficha.</p>
      {customers.isPending && <p role="status">Cargando clientes…</p>}
      {customers.isError && <div role="alert"><p>No se pudieron cargar los clientes.</p><Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button></div>}
      {customers.isSuccess && list.length === 0 && later.length === 0 && !customers.hasNextPage && <p className="text-sm text-muted">{visited.length > 0 && !customers.hasNextPage ? (debouncedSearch ? 'Los clientes de esa búsqueda ya fueron visitados.' : 'Ya visitaste a todos los clientes de esta salida.') : debouncedSearch ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes programados para los días de esta salida en la zona.'}</p>}
      {list.length > 0 && <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-2 rounded-t bg-accent px-2 py-3 text-xs font-semibold text-white"><span>Cliente</span><span>Dirección</span><span className="text-right">Deuda</span></div>}
      <ul className="ui-card flex flex-col overflow-hidden">
        {list.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} /></li>)}
      </ul>
      {customers.isFetchNextPageError && <p role="alert">No se pudo cargar la siguiente página. Podés reintentar.</p>}
      {customers.hasNextPage && <Button variant="secondary" disabled={customers.isFetchingNextPage}
        onClick={() => customers.fetchNextPage()}>
        {customers.isFetchingNextPage ? 'Cargando…' : 'Cargar más clientes'}
      </Button>}
      {later.length > 0 && <section className="flex flex-col gap-2" aria-label="Para visitar más tarde">
        <h2 className="text-sm font-semibold">Para visitar más tarde ({later.length})</h2>
        <ul className="ui-card flex flex-col overflow-hidden">
          {later.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} /></li>)}
        </ul>
      </section>}
      {visited.length > 0 && <details className="ui-card p-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Ya visitados ({visited.length})</summary>
        <ul className="mt-2 flex flex-col overflow-hidden">
          {visited.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} noPurchaseReason={noPurchaseReasons[customer.id]} /></li>)}
        </ul>
      </details>}
    </section>
  )
}
