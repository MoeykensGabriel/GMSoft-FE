import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Panel, Select, sortProducts } from '../../core'
import { productService } from '../../products'
import type { Product } from '../../products'
import { vehicleService } from '../../vehicles'
import type { LoadRange } from '../../vehicles'
import { loadRangesQuery } from '../loadRangesQuery'
import { rangeErrors } from '../utils/loadRange'

function RangesForm({ vehicleId, products, initial }: { vehicleId: string; products: Product[]; initial: LoadRange[] }) {
  const cache = useQueryClient()
  const [draft, setDraft] = useState<Record<string, { min: string; max: string }> | null>(null)
  const [saved, setSaved] = useState(false)
  const original = Object.fromEntries(products.map((product) => {
    const range = initial.find((row) => row.productId === product.id)
    return [product.id, { min: String(range?.min ?? ''), max: String(range?.max ?? '') }]
  }))
  const values = draft ?? original
  const rows = products.map((product) => ({
    productId: product.id,
    min: values[product.id]?.min ? Number(values[product.id].min) : null,
    max: values[product.id]?.max ? Number(values[product.id].max) : null,
  }))
  const errors = rangeErrors(rows)
  const changed = products.some(({ id }) => (['min', 'max'] as const).some((field) =>
    (values[id]?.[field] || '') !== original[id][field]))
  const save = useMutation({
    mutationFn: (ranges: LoadRange[]) => vehicleService.saveLoadRanges(vehicleId, ranges),
    retry: false,
    onSuccess: async (_, ranges) => {
      cache.setQueryData(loadRangesQuery(vehicleId).queryKey, ranges)
      setDraft(null)
      await cache.invalidateQueries({ queryKey: loadRangesQuery(vehicleId).queryKey })
      setSaved(true)
    },
  })
  const valid = !Object.keys(errors).length
  return <form className="flex w-full max-w-lg min-w-0 flex-col gap-3" onSubmit={(event) => {
    event.preventDefault()
    if (valid && changed && !save.isPending) save.mutate(rows.filter((row) => row.min !== null || row.max !== null))
  }}>
    <fieldset disabled={save.isPending} className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-x-2 gap-y-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
        <span className="text-sm font-semibold">Producto</span>
        <span className="text-sm font-semibold">Mín</span>
        <span className="text-sm font-semibold">Máx</span>
        {products.map((product) => <div key={product.id} className="contents">
          <span className="min-w-0 break-words text-sm">{product.detail}</span>
          {(['min', 'max'] as const).map((field) => <input key={field}
            className="ui-input min-w-0 px-2" type="number" min={0} max={100000} step={1} inputMode="numeric"
            aria-label={`${product.detail}: ${field === 'min' ? 'Mín' : 'Máx'}`}
            aria-invalid={Boolean(errors[product.id]?.[field]) || undefined}
            title={errors[product.id]?.[field]} value={values[product.id]?.[field] ?? ''}
            onChange={(event) => {
              setDraft({ ...values, [product.id]: { ...values[product.id], [field]: event.target.value } })
              setSaved(false); save.reset()
            }} />)}
        </div>)}
      </div>
    </fieldset>
    <ErrorMessage error={save.error} />
    {saved && <p role="status" className="text-sm">Capacidad por vehículo guardada.</p>}
    <Button type="submit" variant="primary" className="self-end" disabled={!valid || !changed || save.isPending}>
      {save.isPending ? 'Guardando...' : 'Guardar rangos'}
    </Button>
  </form>
}

export function LoadRangesPanel() {
  const [vehicleId, setVehicleId] = useState('')
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const products = useQuery({ queryKey: ['products', 'published'], queryFn: () => productService.listPublished() })
  const ranges = useQuery(loadRangesQuery(vehicleId))
  const error = vehicles.error ?? products.error ?? (vehicleId ? ranges.error : null)
  return <Panel title="Capacidad por vehículo">
    <Select label="Vehículo" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
      <option value="">Elegí un vehículo</option>
      {(vehicles.data ?? []).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.licensePlate})</option>)}
    </Select>
    {error ? <><ErrorMessage error={error} /><Button variant="secondary" onClick={() => {
      if (vehicles.isError) void vehicles.refetch()
      if (products.isError) void products.refetch()
      if (vehicleId && ranges.isError) void ranges.refetch()
    }}>Reintentar</Button></> : vehicleId && (ranges.isPending || products.isPending
      ? <p role="status">Cargando rangos...</p>
      : <RangesForm key={vehicleId} vehicleId={vehicleId} initial={ranges.data ?? []}
          products={sortProducts(products.data?.items ?? [], (product) => product.detail)} />)}
  </Panel>
}
