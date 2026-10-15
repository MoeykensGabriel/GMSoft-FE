import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../core'
import { customerService } from '../services/customerService'
import { routeMembershipChanged } from '../utils/routeMembership'

export function RouteUpdateNotice({ vehicleId, zoneId, routeDays }: { vehicleId: string; zoneId: string; routeDays: number[] }) {
  const cache = useQueryClient()
  const scope = JSON.stringify([vehicleId, zoneId, [...routeDays].sort()])
  const previous = useRef<{ scope: string; ids: string[] } | null>(null)
  const [visible, setVisible] = useState(false)
  // A separate complete snapshot avoids false notices from search, loading another
  // page or marking a visit, and detects changes beyond the visible first page.
  const query = useQuery({
    queryKey: ['customers', 'route-membership', vehicleId, zoneId, routeDays],
    queryFn: async () => {
      const ids: string[] = []
      let page = 1
      while (true) {
        const result = await customerService.listByZone(zoneId, 100, page, routeDays, '', vehicleId)
        ids.push(...result.items.map((item) => item.id))
        if (!result.hasNextPage) return ids
        page++
      }
    },
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
