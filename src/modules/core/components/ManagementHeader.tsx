import { Link } from 'react-router-dom'

export function ManagementHeader({ title, description, createTo, createLabel }: {
  title: string; description: string; createTo: string; createLabel: string
}) {
  return <header className="flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-xl font-semibold">{title}</h1><p className="mt-1 text-sm text-neutral-600">{description}</p></div>
    <Link to={createTo} className="flex min-h-11 items-center rounded-md bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800">{createLabel}</Link>
  </header>
}
