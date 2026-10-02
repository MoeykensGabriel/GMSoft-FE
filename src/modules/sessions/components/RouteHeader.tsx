export function RouteHeader({ zoneName, date }: { zoneName: string; date: string }) {
  const label = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(date))
  return <header className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 className="text-lg font-semibold">Reparto · {zoneName}</h1>
    <p className="text-sm capitalize">{label}</p>
  </header>
}
