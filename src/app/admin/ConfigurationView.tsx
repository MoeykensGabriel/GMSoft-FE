import type { ReactNode } from 'react'
import { Page, PageHeader } from '../../modules/core'
import { ActivitySettingsPanel } from '../../modules/customers/admin'
import { PromotionSettings } from '../../modules/promotions/admin'
import { WorkingHoursPanel } from '../../modules/workingHours/admin'
import { LoadRangesPanel } from '../../modules/vehicleLoads/admin'

function ConfigurationPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title={title} description={description} />
    {children}
  </Page>
}

export const WorkingHoursView = () =>
  <ConfigurationPage title="Horario laboral" description="Los días y horas en que trabaja la empresa."><WorkingHoursPanel /></ConfigurationPage>

export const CustomerActivityView = () =>
  <ConfigurationPage title="Actividad de clientes" description="Cuántas semanas sin comprar ponen a un cliente en rojo o en negro."><ActivitySettingsPanel /></ConfigurationPage>

export const PromotionSettingsView = () =>
  <ConfigurationPage title="Promociones" description="Plazo de retiro de las promociones."><PromotionSettings /></ConfigurationPage>

export const ExpectedLoadView = () =>
  <ConfigurationPage title="Capacidad por vehículo" description="Cuánto puede llevar cada vehículo: mínimo y máximo por producto."><LoadRangesPanel /></ConfigurationPage>
