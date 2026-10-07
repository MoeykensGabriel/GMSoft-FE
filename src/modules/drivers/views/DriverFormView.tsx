import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Page, PageHeader } from '../../core'
import { vehicleService } from '../../vehicles'
import { DriverForm } from '../components/DriverForm'
import type { DriverFormValues } from '../components/DriverForm'
import { DriverPasswordForm } from '../components/DriverPasswordForm'
import { driverService } from '../services/driverService'

export function DriverFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const driver = useQuery({ queryKey: ['drivers', 'detail', id], queryFn: () => driverService.getById(id!), enabled: Boolean(id) })
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const save = useMutation({
    mutationFn: async (values: DriverFormValues) => {
      const { userName, password, email, ...profile } = values
      if (id) await driverService.update(id, profile)
      else {
        const { isActive: _isActive, ...newProfile } = profile
        await driverService.create({ ...newProfile, userName, password, email })
      }
    },
    onSuccess: async () => {
      await Promise.all(['drivers', 'sessions'].map((key) => client.invalidateQueries({ queryKey: [key] })))
      navigate('/panel/choferes')
    },
  })
  if (vehicles.isPending || (id && driver.isPending)) return <p className="p-6">Cargando datos...</p>
  if (vehicles.isError || (id && driver.isError)) return <div className="flex flex-col gap-3 p-6"><ErrorMessage error={vehicles.error ?? driver.error} />
    <Button variant="secondary" onClick={() => { vehicles.refetch(); if (id) driver.refetch() }}>Reintentar</Button><Link to="/panel/choferes">Volver a choferes</Link></div>
  return <Page className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
    <Link to="/panel/choferes" className="text-sm underline">← Choferes</Link>
    <PageHeader title={<>{id ? 'Editar chofer' : 'Nuevo chofer'}</>} />
    <DriverForm key={`profile-${id ?? 'new'}`} initial={id ? driver.data : undefined} vehicles={vehicles.data ?? []} saving={save.isPending} error={save.error} onSubmit={(values) => save.mutate(values)} />
    {id && driver.data?.userName && <DriverPasswordForm key={`password-${id}`} driverId={id} userName={driver.data.userName} disabled={save.isPending} />}
  </Page>
}
