import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth'
import { Button, ErrorMessage, Panel } from '../../core'
import { useCurrentSession } from '../../sessions'
import type { Promotion } from '../services/promotionService'
import { promotionService } from '../services/promotionService'
import { sortPending } from '../utils/promotion'
import { PromotionSummary } from './PromotionSummary'
import { ClosePromotionForm } from './ClosePromotionForm'

export function PendingPromotions() {
  const { user } = useAuth()
  const session = useCurrentSession()
  const pending = useQuery({ queryKey: ['promotions', 'pending', user?.userId, session.data?.vehicleId],
    queryFn: promotionService.pending, enabled: Boolean(user), staleTime: 0,
    refetchOnWindowFocus: true, refetchOnReconnect: true,
  })
  const [selected, setSelected] = useState<{ promotion: Promotion; convert: boolean } | null>(null)
  return <Panel title="Promociones pendientes">
    {selected ? <ClosePromotionForm key={selected.promotion.id} {...selected} onBack={() => setSelected(null)} /> : <>
      {pending.isPending && <p role="status">Cargando promociones...</p>}
      {pending.isError && <><ErrorMessage error={pending.error} /><Button variant="secondary" onClick={() => pending.refetch()}>Reintentar</Button></>}
      {pending.isSuccess && !pending.data.length && <p>No hay promociones pendientes para tu vehículo.</p>}
      {!session.data && <p className="text-sm">Para cerrar una promoción necesitás una salida abierta del mismo vehículo.</p>}
      {sortPending(pending.data ?? []).map((promotion) => <article key={promotion.id} className="ui-card flex flex-col gap-4 p-3">
        <PromotionSummary promotion={promotion} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="min-h-11" disabled={session.data?.status !== 'Open' || session.data.vehicleId !== promotion.vehicleId}
            onClick={() => setSelected({ promotion, convert: true })}>Se hace cliente</Button>
          <Button variant="danger" className="min-h-11" disabled={session.data?.status !== 'Open' || session.data.vehicleId !== promotion.vehicleId}
            onClick={() => setSelected({ promotion, convert: false })}>No se hace cliente</Button>
        </div>
      </article>)}
    </>}
  </Panel>
}
