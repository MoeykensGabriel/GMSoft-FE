import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../services/sessionService'
import { usageSinceLabel } from '../utils/usageSince'

/** Cuántos días lleva el sistema en uso, en la barra del Home. Sin salidas no se muestra. */
export function UsageSinceBadge() {
  const usage = useQuery({ queryKey: ['sessions', 'usage-since'], queryFn: sessionService.getUsageSince, staleTime: 60 * 60_000 })
  const label = usage.data ? usageSinceLabel(usage.data.since, usage.data.days) : null
  if (!label) return null
  return <span className="rounded bg-white/15 px-3 py-1 text-sm font-semibold tabular-nums">{label}</span>
}
