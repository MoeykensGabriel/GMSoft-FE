import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, ErrorMessage, formatDate, formatDateTime, Page, PageHeader, Pagination, Select } from '../../core'
import { driverService } from '../../drivers'
import { vehicleService } from '../../vehicles'
import { inspectionService } from '../services/inspectionService'
import type { InspectionReportItem } from '../services/inspectionService'
import { driverVisitLabel, NOT_BUYING_REASONS, TONE_BORDER, toneOf } from '../utils/inspectionStatus'

/** Lo que encontraron los controladores en la calle, del más nuevo al más viejo. */
export function InspectionReportView() {
  const [inspectorId, setInspectorId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [page, setPage] = useState(1)
  const inspectors = useQuery({ queryKey: ['drivers', 'inspectors'], queryFn: driverService.listInspectors })
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const report = useQuery({
    queryKey: ['inspections', 'report', inspectorId, vehicleId, page],
    queryFn: () => inspectionService.report({ inspectorId, vehicleId, page }),
  })

  return <Page className="flex flex-col gap-4 p-4 md:p-6">
    <PageHeader title="Control en ruta" />
    <div className="grid gap-3 sm:grid-cols-2">
      <Select label="Controlador" name="inspectorId" value={inspectorId} onChange={(e) => { setInspectorId(e.target.value); setPage(1) }}>
        <option value="">Todos los controladores</option>
        {inspectors.data?.map((i) => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}{i.isActive ? '' : ' (inactivo)'}</option>)}
      </Select>
      <Select label="Camión" name="vehicleId" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setPage(1) }}>
        <option value="">Todos los camiones</option>
        {vehicles.data?.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.licensePlate}</option>)}
      </Select>
    </div>
    <Legend />
    {report.isPending && <p role="status" className="text-muted">Cargando controles…</p>}
    {report.isError && <div className="flex flex-col gap-3"><ErrorMessage error={report.error} />
      <Button variant="secondary" onClick={() => report.refetch()}>Reintentar</Button></div>}
    {report.isSuccess && <>
      {report.data.items.length === 0 && <p className="text-muted">No hay controles con estos filtros.</p>}
      {bySession(report.data.items).map((group) => <section key={group[0].sessionId} className="flex flex-col gap-3"
        aria-label={`Salida de ${group[0].vehicleName}`}>
        <h2 className="rounded border border-line bg-canvas px-4 py-2 font-semibold">
          {formatDate(group[0].sessionOpenedAt)} · {group[0].vehicleName} · {group[0].licensePlate} · Chofer {group[0].driverName}
          <span className="font-normal text-muted"> · {group.length} {group.length === 1 ? 'cliente controlado' : 'clientes controlados'}</span>
        </h2>
        <ul className="flex flex-col gap-3">
          {group.map((item) => <li key={item.id}><InspectionCard item={item} /></li>)}
        </ul>
      </section>)}
      {report.data.totalPages > 1 && <Pagination {...report.data} onChange={setPage} />}
    </>}
  </Page>
}

/** Los controles ya vienen por salida y en orden de recorrido: se cortan donde cambia la salida. */
function bySession(items: InspectionReportItem[]) {
  const groups: InspectionReportItem[][] = []
  for (const item of items) {
    const last = groups.at(-1)
    if (last && last[0].sessionId === item.sessionId) last.push(item)
    else groups.push([item])
  }
  return groups
}

function Legend() {
  return <p className="flex flex-wrap gap-4 text-sm">
    <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" />Compra, envases bien</span>
    <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" />Se corrigieron envases</span>
    <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-danger" />No compra más</span>
  </p>
}

function InspectionCard({ item }: { item: InspectionReportItem }) {
  const visit = driverVisitLabel(item)
  const containers = item.containers.filter((c) => c.systemQuantity !== 0 || c.realQuantity !== 0)
  return <article className={`ui-card flex flex-col gap-3 border-l-8 p-4 ${TONE_BORDER[toneOf(item)]}`}>
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-muted">Controlado {formatDateTime(item.inspectedAt)}</p>
        <h3 className="text-lg font-semibold">{item.routeOrder}. {item.customerName}</h3>
        <p className="text-sm text-muted">{item.address} · {item.zoneName}</p>
      </div>
      {item.stillBuys ? <Badge tone="success">Compra</Badge>
        : <Badge tone="danger">No compra: {NOT_BUYING_REASONS[item.notBuyingReason ?? 'Other']}</Badge>}
    </header>
    <p className="text-sm">Controló <strong>{item.inspectorName}</strong></p>
    <p className="flex flex-wrap items-center gap-2 text-sm">El chofer marcó: <Badge tone={visit.tone}>{visit.text}</Badge></p>
    {containers.length === 0 ? <p className="text-sm text-muted">Sin envases, ni en el sistema ni en la casa.</p>
      : <table className="w-full text-sm">
        <thead><tr className="text-left text-muted"><th className="py-1 font-medium">Envase</th><th className="py-1 text-right font-medium">Sistema</th>
          <th className="py-1 text-right font-medium">Contó</th><th className="py-1 text-right font-medium">Diferencia</th></tr></thead>
        <tbody>{containers.map((c) => {
          const diff = c.realQuantity - c.systemQuantity
          return <tr key={c.product} className={`border-t border-line ${diff !== 0 ? 'bg-orange-50 font-semibold text-orange-700' : ''}`}>
            <td className="py-1">{c.product}</td><td className="py-1 text-right tabular-nums">{c.systemQuantity}</td>
            <td className="py-1 text-right tabular-nums">{c.realQuantity}</td>
            <td className="py-1 text-right tabular-nums">{diff === 0 ? '—' : diff > 0 ? `+${diff}` : diff}</td>
          </tr>
        })}</tbody>
      </table>}
    {item.notes && <p className="rounded border border-line bg-canvas p-2 text-sm">{item.notes}</p>}
  </article>
}
