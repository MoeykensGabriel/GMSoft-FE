import type { OrderedZone } from '../../zones'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../core'
import { customerService } from '../services/customerService'
import { routeMembershipChanged } from '../utils/routeMembership'

export function RouteUpdateNotice({ vehicleId, zones, routeDays }: { vehicleId: string; zones: OrderedZone[]; routeDays: number[] }) {
  const cache = useQueryClient()
  const scope = JSON.stringify([vehicleId, zones, [...routeDays].sort()])
  const previous = useRef<{ scope: string; ids: string[] } | null>(null)
  const [visible, setVisible] = useState(false)
  // La foto completa evita avisos por búsquedas o visitas y detecta cambios en todas las zonas.
  const query = useQuery({
    queryKey: ['customers', 'route-membership', vehicleId, zones, routeDays],
    queryFn: async () => (await customerService.listRoute(zones, routeDays, vehicleId)).map((item) => item.id),
    refetchInterval: 30_000,
  })
  useEffect(() => {
    if (!query.data) return
    if (previous.current?.scope !== scope) setVisible(false)
    else if (routeMembershipChanged(previous.current.ids, query.data)) {
      setVisible(true)
      void cache.invalidateQueries({ queryKey: ['customers', 'route'] })
    }
    previous.current = { scope, ids: query.data }
  }, [query.data, scope, cache])
  if (!visible) return null
  return <section role="status" className="flex flex-col gap-3 rounded-lg border-2 border-warning bg-warning-soft p-4">
    <p className="text-lg font-semibold">La oficina actualizó tu recorrido</p>
    <p className="text-sm">Hay clientes que entraron o salieron de tu lista. Revisá el recorrido actualizado.</p>
    <Button className="min-h-11 w-full" onClick={() => setVisible(false)}>Entendido</Button>
  </section>
}
