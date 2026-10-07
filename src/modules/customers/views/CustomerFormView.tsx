import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Page, PageHeader } from '../../core'
import { vehicleService } from '../../vehicles'
import { zoneService } from '../../zones'
import { CustomerForm } from '../components/CustomerForm'
import { customerService } from '../services/customerService'
import type { CustomerInput } from '../services/customerService'

export function CustomerFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cache = useQueryClient()
  const customer = useQuery({ queryKey: ['customers', 'detail', id], queryFn: () => customerService.getById(id!), enabled: Boolean(id) })
  const zones = useQuery({ queryKey: ['zones', 'customer-options'], queryFn: () => zoneService.listAll() })
  const vehicles = useQuery({ queryKey: ['vehicles', 'customer-options'], queryFn: () => vehicleService.listAll() })
  const save = useMutation({
    mutationFn: async (input: CustomerInput) => {
      if (id) await customerService.update(id, input)
      else await customerService.create(input)
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['customers'] })
      navigate('/panel/clientes')
    },
  })
  return <Page className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
    <Link to="/panel/clientes" className="text-sm underline">← Clientes</Link>
    <PageHeader title={<>{id ? 'Editar cliente' : 'Nuevo cliente'}</>} />
    {(zones.isPending || vehicles.isPending || (id && customer.isPending)) ? <p>Cargando…</p>
      : (zones.isError || vehicles.isError || (id && customer.isError)) ? <div>
        <ErrorMessage error={zones.error ?? vehicles.error ?? customer.error} />
        <Button variant="secondary" onClick={() => { void zones.refetch(); void vehicles.refetch(); if (id) void customer.refetch() }}>Reintentar</Button>
      </div> : zones.data?.length === 0 ? <p>Primero <Link to="/panel/zonas/nueva" className="underline">creá una zona de reparto</Link>.</p>
      : vehicles.data?.length === 0 ? <p>Primero cargá un camión desde el panel de administración.</p>
      : <CustomerForm key={id ?? 'new'} initial={customer.data} zones={zones.data ?? []} vehicles={vehicles.data ?? []} saving={save.isPending} error={save.error} onSave={(input) => save.mutate(input)} />}
  </Page>
}
