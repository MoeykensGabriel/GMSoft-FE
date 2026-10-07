import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, Field } from '../../core'
import { customerService } from '../services/customerService'
import { CustomerCard } from './CustomerCard'

export function CustomerRouteList({ vehicleId, zoneId, routeDays, onSelect, deferredCustomerIds = [] }: {
  vehicleId: string
  zoneId: string
  routeDays: number[]
  deferredCustomerIds?: string[]
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
    refetchInterval: 60_000,
    queryFn: ({ pageParam }) => customerService.listByZone(zoneId, 20, pageParam, routeDays, debouncedSearch, vehicleId),
    getNextPageParam: (page) => page.hasNextPage ? page.page + 1 : undefined,
  })
  const list = customers.data?.pages.flatMap((page) => page.items) ?? []
  return (
    <section className="flex flex-col gap-3" aria-label="Clientes en orden de recorrido">
      <div className="ui-card bg-surface p-3">
        <Field label="Buscar clientes del recorrido" name="route-search" type="search" placeholder="Nombre, dirección o teléfono" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <p className="text-xs text-muted">Tocá un cliente para abrir su ficha.</p>
      {customers.isPending && <p role="status">Cargando clientes…</p>}
      {customers.isError && <div role="alert"><p>No se pudieron cargar los clientes.</p><Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button></div>}
      {customers.isSuccess && list.length === 0 && <p className="text-sm text-muted">{debouncedSearch ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes programados para los días de esta salida en la zona.'}</p>}
      {list.length > 0 && <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-2 rounded-t bg-accent px-2 py-3 text-xs font-semibold text-white"><span>Cliente</span><span>Dirección</span><span className="text-right">Deuda</span></div>}
      <ul className="ui-card flex flex-col overflow-hidden">
        {list.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} deferred={deferredCustomerIds.includes(customer.id)} /></li>)}
      </ul>
      {customers.isFetchNextPageError && <p role="alert">No se pudo cargar la siguiente página. Podés reintentar.</p>}
      {customers.hasNextPage && <Button variant="secondary" disabled={customers.isFetchingNextPage}
        onClick={() => customers.fetchNextPage()}>
        {customers.isFetchingNextPage ? 'Cargando…' : 'Cargar más clientes'}
      </Button>}
    </section>
  )
}
