import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, Field, Page, PageHeader, Pagination, Select, formatDateTime } from '../../core'
import { vehicleService } from '../../vehicles'
import type { PromotionFilters } from '../services/promotionService'
import { promotionService } from '../services/promotionService'
import { pickupLabel } from '../utils/promotion'
import { PromotionBadge } from '../components/PromotionSummary'
import { PromotionSettings } from '../components/PromotionSettings'

export function PromotionListView() {
  const [filters, setFilters] = useState<PromotionFilters>({ status: '', vehicleId: '', from: '', to: '' })
  const [page, setPage] = useState(1)
  const validDates = !filters.from || !filters.to || filters.from <= filters.to
  const promotions = useQuery({ queryKey: ['promotions', 'list', filters, page],
    // Sin vehículo no se consulta: el listado no se carga solo al entrar.
    queryFn: () => promotionService.list(filters, page), enabled: validDates && Boolean(filters.vehicleId),
  })
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  function filter<K extends keyof PromotionFilters>(key: K, value: PromotionFilters[K]) {
    setFilters({ ...filters, [key]: value }); setPage(1)
  }
  return <Page className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
    <PageHeader title="Promociones" description="Pruebas de productos, prospectos y envases prestados." />
    <PromotionSettings />
    <div className="ui-toolbar flex flex-wrap items-end gap-3">
      <Select label="Vehículo" value={filters.vehicleId} onChange={(event) => filter('vehicleId', event.target.value)}>
        <option value="">Elegí un vehículo</option>{vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
      </Select>
      <Select label="Estado" value={filters.status} onChange={(event) => filter('status', event.target.value as PromotionFilters['status'])}>
        <option value="">Todos</option><option value="Pending">Pendientes (incluye vencidas)</option>
        <option value="Overdue">Vencidas</option><option value="Converted">Convertidas</option><option value="NotConverted">No convertidas</option>
      </Select>
      <Field label="Registradas desde" type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => filter('from', event.target.value)} />
      <Field label="Registradas hasta" type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => filter('to', event.target.value)} />
      <Button variant="secondary" onClick={() => { setFilters({ status: '', vehicleId: '', from: '', to: '' }); setPage(1) }}>Limpiar filtros</Button>
    </div>
    {vehicles.isError && <><ErrorMessage error={vehicles.error} /><Button variant="secondary" onClick={() => vehicles.refetch()}>Reintentar vehículos</Button></>}
    {!validDates ? <p role="alert" className="text-danger">La fecha desde no puede ser posterior a la fecha hasta.</p>
      : !filters.vehicleId ? <p className="text-sm text-muted">Elegí un vehículo para ver sus promociones.</p>
      : promotions.isPending ? <p role="status">Cargando promociones...</p>
      : promotions.isError ? <><ErrorMessage error={promotions.error} /><Button variant="secondary" onClick={() => promotions.refetch()}>Reintentar</Button></>
      : <>
        <p className="text-sm text-muted">{promotions.data.totalCount} promociones · Fechas de registro en horario de Argentina</p>
        {!promotions.data.items.length ? <p>No se encontraron promociones con estos filtros.</p> : <DataTable label="Promociones" className="min-w-[65rem]">
          <thead><tr><th scope="col">Fecha</th><th scope="col">Vehículo</th><th scope="col">Chofer</th><th scope="col">Prospecto</th><th scope="col">Productos / envases</th><th scope="col">Retiro</th><th scope="col">Estado</th><th scope="col">Detalle</th></tr></thead>
          <tbody>{promotions.data.items.map((promotion) => <tr key={promotion.id}>
            <td>{formatDateTime(promotion.registeredAt, BUSINESS_TIME_ZONE)}</td>
            <td>{promotion.vehicleName}<span className="block text-xs text-muted">{promotion.vehicleLicensePlate}</span></td>
            <td>{promotion.driverName}</td>
            <td>{promotion.prospect.contactName}<span className="block text-xs text-muted">{promotion.prospect.businessName}</span></td>
            <td><ul>{promotion.lines.map((line) => <li key={line.productId}>{line.quantity} × {line.productDetail}<span className="block text-xs text-muted">{line.containersLoaned} envases prestados</span></li>)}</ul></td>
            <td>{pickupLabel(promotion.pickupDate)}</td><td><PromotionBadge promotion={promotion} /></td>
            <td><Link className="ui-link inline-flex min-h-11 items-center" to={`/panel/promociones/${encodeURIComponent(promotion.id)}`} aria-label={`Ver promoción de ${promotion.prospect.contactName}`}>Ver detalle</Link></td>
          </tr>)}</tbody>
        </DataTable>}
        <Pagination {...promotions.data} onChange={setPage} />
      </>}
  </Page>
}
