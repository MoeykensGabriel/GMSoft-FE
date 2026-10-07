import { ActiveDeparturesCard } from '../../modules/sessions'
import { Page, PageHeader } from '../../modules/core'

export function AdminHomeView() {
  return <Page className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Home" description="Estado del reparto" />
    <div className="grid min-w-0 gap-5"><ActiveDeparturesCard /></div>
  </Page>
}
