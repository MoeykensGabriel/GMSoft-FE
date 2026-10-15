import { Page, PageHeader } from '../../modules/core'
import { ActivitySettingsPanel } from '../../modules/customers/admin'
import { PromotionSettings } from '../../modules/promotions/admin'
import { WorkingHoursPanel } from '../../modules/workingHours/admin'

export function ConfigurationView() {
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Configuración" description="Ajustes de la empresa." />
    <WorkingHoursPanel />
    <ActivitySettingsPanel />
    <PromotionSettings />
  </Page>
}
