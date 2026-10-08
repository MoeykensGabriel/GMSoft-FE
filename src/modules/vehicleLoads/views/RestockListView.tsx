import { Page, PageHeader } from '../../core'
import { ActiveDeparturesCard } from '../../sessions'

/** Recargas en ruta: los camiones que están en la calle y desde dónde recargar cada uno. */
export function RestockListView() {
  return <Page className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Recargas" description="Sumá productos llenos a un camión que está en la calle. La recarga queda en la misma salida." />
    <ActiveDeparturesCard />
  </Page>
}
