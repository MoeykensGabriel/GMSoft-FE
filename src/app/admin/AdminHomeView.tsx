import { RemovalRequestsNotice } from '../../modules/customers/admin'
import { UncoveredCustomers } from '../../modules/routePlanning'
import { ActiveDeparturesCard } from '../../modules/sessions'
import { LoadedVehiclesCard } from '../../modules/vehicleLoads'
import { Page, PageHeader } from '../../modules/core'

export function AdminHomeView() {
  return <Page className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Home" description="Estado del reparto" />
    <RemovalRequestsNotice />
    <UncoveredCustomers summary />
    <LoadedVehiclesCard />
    <div className="grid min-w-0 gap-5"><ActiveDeparturesCard /></div>
  </Page>
}
