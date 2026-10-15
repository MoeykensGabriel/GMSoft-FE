import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, DataTable, ErrorMessage, Panel, weekdayLabels } from '../../core'
import { scheduleService, uncoveredKey } from '../../schedule'
import { vehicleService } from '../../vehicles'

export function UncoveredCustomers({ summary = false }: { summary?: boolean }) {
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: uncoveredKey(page), queryFn: () => scheduleService.uncovered(page), refetchInterval: 30_000 })
  const vehicles = useQuery({ queryKey: ['vehicles', 'uncovered-options'], queryFn: vehicleService.listAll, enabled: !summary })
  if (summary) return query.data?.totalCount ? <div role="status" className="rounded border border-warning/40 bg-warning-soft p-4 text-warning">
    <p>{query.data.totalCount} clientes no figuran en ningún recorrido</p>
    <p className="text-sm">Tienen uno o más días sin cubrir según la agenda.</p>
    <Link className="underline" to="/panel/recorridos#sin-cubrir">Revisar clientes fuera de recorrido</Link>
  </div> : query.isError ? <div><ErrorMessage error={query.error} /><Button variant="secondary" onClick={() => query.refetch()}>Reintentar aviso de recorridos</Button></div> : null
  return <section id="sin-cubrir"><Panel title="Clientes fuera de recorrido">
    <p className="mb-3 text-sm text-muted">Clientes con al menos un día sin cubrir según la agenda guardada de su camión.</p>
    <ErrorMessage error={query.error ?? vehicles.error} />
    {(query.isError || vehicles.isError) && <Button variant="secondary" onClick={() => { void query.refetch(); void vehicles.refetch() }}>Reintentar</Button>}
    {query.isPending ? <p>Cargando clientes…</p> : query.data && <>
      <p className="mb-3">{query.data.totalCount} clientes con días sin cubrir</p>
      <DataTable label="Clientes fuera de recorrido"><thead><tr><th>Cliente</th><th>Camión</th><th>Zona</th><th>Días sin cubrir</th><th>Acción</th></tr></thead>
        <tbody>{query.data.items.map((item) => <tr key={item.id}>
          <td data-label="Cliente">{item.displayName}<span className="block text-muted">{item.address}</span></td>
          <td data-label="Camión">{vehicles.data?.find((vehicle) => vehicle.id === item.vehicleId)?.name ?? 'Camión asignado'}</td>
          <td data-label="Zona">{item.zoneName}</td><td data-label="Días sin cubrir">{weekdayLabels(item.uncoveredDays)}</td>
          <td><Link className="underline" to={`/panel/clientes/${encodeURIComponent(item.id)}`}>Ver cliente</Link></td>
        </tr>)}</tbody>
      </DataTable>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" disabled={!query.data.hasPreviousPage} onClick={() => setPage(page - 1)}>Anterior</Button>
        <span>Página {page} de {Math.max(1, query.data.totalPages)}</span>
        <Button variant="secondary" disabled={!query.data.hasNextPage} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </div>
    </>}
  </Panel></section>
}
