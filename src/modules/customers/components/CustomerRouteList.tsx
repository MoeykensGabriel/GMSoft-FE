import { zoneBlocks } from '../../zones'
import type { OrderedZone } from '../../zones'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, Field } from '../../core'
import { customerService } from '../services/customerService'
import type { NoPurchaseReason } from '../utils/noPurchase'
import { splitRoute } from '../utils/routeLater'
import { CustomerCard } from './CustomerCard'

export function CustomerRouteList({ vehicleId, zones, routeDays, onSelect, noPurchaseReasons = {}, visitedCustomerIds = [], laterCustomerIds = [] }: {
  vehicleId: string
  zones: OrderedZone[]
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
  const customers = useQuery({
    queryKey: ['customers', 'route', vehicleId, zones, routeDays, debouncedSearch],
    refetchOnWindowFocus: true,
    queryFn: () => customerService.listRoute(zones, routeDays, vehicleId, debouncedSearch),
  })
  const all = customers.data ?? []
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
      {customers.isSuccess && list.length === 0 && later.length === 0 && <p className="text-sm text-muted">{visited.length > 0 ? (debouncedSearch ? 'Los clientes de esa búsqueda ya fueron visitados.' : 'Ya visitaste a todos los clientes de esta salida.') : debouncedSearch ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes programados para los días de esta salida en las zonas.'}</p>}
      {list.length > 0 && <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-2 rounded-t bg-accent px-2 py-3 text-xs font-semibold text-white"><span>Cliente</span><span>Dirección</span><span className="text-right">Deuda</span></div>}
      {zoneBlocks(zones, list).map((block) => <section key={block.zoneId} className="flex flex-col gap-2">
        {zones.length > 1 && <h2 className="font-semibold text-danger">{block.zoneName} · {block.customers.length} clientes</h2>}
        <ul className="ui-card flex flex-col overflow-hidden">
          {block.customers.map((customer) => <li key={customer.id}><CustomerCard customer={customer} onSelect={onSelect} /></li>)}
        </ul>
      </section>)}
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
