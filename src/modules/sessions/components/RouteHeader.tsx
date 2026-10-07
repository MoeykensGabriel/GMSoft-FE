import { weekdayLabels } from '../../core'

export function RouteHeader({ zoneName, date, userName, routeDays }: { zoneName: string; date: string; userName: string; routeDays: number[] }) {
  const label = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(date))
  return <header className="flex flex-col gap-1 rounded border border-brand bg-brand p-4 text-center text-white">
    <p className="text-sm">Usuario: <strong>{userName}</strong></p>
    <h1 className="text-base font-semibold">Zona: {zoneName}</h1>
    <p className="text-xs capitalize">{label}</p>
    <p className="text-xs">Recorrido: {weekdayLabels(routeDays)}</p>
  </header>
}
