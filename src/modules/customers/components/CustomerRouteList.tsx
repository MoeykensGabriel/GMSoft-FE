import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '../../core'
import { customerService } from '../services/customerService'
import { CustomerCard } from './CustomerCard'

export function CustomerRouteList({ zoneId, onSelect }: {
  zoneId: string
  onSelect: (id: string) => void
}) {
  const customers = useInfiniteQuery({
    queryKey: ['customers', 'route', zoneId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => customerService.listByZone(zoneId, 20, pageParam),
    getNextPageParam: (page) => page.hasNextPage ? page.page + 1 : undefined,
  })
  if (customers.isPending) return <p>Cargando clientes…</p>
  if (customers.isError) return <div role="alert">
    <p>No se pudieron cargar los clientes.</p>
    <Button variant="secondary" onClick={() => customers.refetch()}>Reintentar</Button>
  </div>

  const list = customers.data.pages.flatMap((page) => page.items)
  return (
    <section className="flex flex-col gap-3" aria-label="Clientes en orden de recorrido">
      <h2 className="font-semibold">Clientes del recorrido</h2>
      {list.length === 0 && <p className="text-sm text-neutral-600">Todavía no hay clientes en esta zona. Agregá el primero con una venta.</p>}
      <ul className="flex flex-col gap-3">
        {list.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} /></li>)}
      </ul>
      {customers.isFetchNextPageError && <p role="alert">No se pudo cargar la siguiente página. Podés reintentar.</p>}
      {customers.hasNextPage && <Button variant="secondary" disabled={customers.isFetchingNextPage}
        onClick={() => customers.fetchNextPage()}>
        {customers.isFetchingNextPage ? 'Cargando…' : 'Cargar más clientes'}
      </Button>}
    </section>
  )
}
