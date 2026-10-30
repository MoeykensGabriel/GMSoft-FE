import { RemovalRequestsNotice } from '../../modules/customers/admin'
import { UncoveredCustomers } from '../../modules/routePlanning'
import { PendingSettlementsCard } from '../../modules/sessions/admin'
import { Page, PageHeader } from '../../modules/core'
import { useAlertCount } from './useAlertCount'

export function AlertsView() {
  const { activas, cargando } = useAlertCount()
  return <Page className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Alertas" />
    <PendingSettlementsCard />
    <RemovalRequestsNotice />
    <UncoveredCustomers summary />
    {!cargando && !activas && <p className="ui-card bg-surface p-3 text-sm text-muted">No hay alertas.</p>}
  </Page>
}
