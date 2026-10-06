import { ActiveDeparturesCard } from '../../modules/sessions'

export function AdminHomeView() {
  return <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
    <div>
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mt-1 text-sm text-neutral-600">Estado del reparto</p>
    </div>
    <div className="grid min-w-0 gap-5"><ActiveDeparturesCard /></div>
  </main>
}
