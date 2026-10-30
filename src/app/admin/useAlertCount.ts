import { useQuery } from '@tanstack/react-query'
import { customerService } from '../../modules/customers'
import { scheduleService, uncoveredKey } from '../../modules/schedule'
import { sessionService } from '../../modules/sessions'

/** Cuántos tipos de alerta hay activos, no cuántos clientes o salidas tiene cada uno. Usa las mismas consultas que las cards. */
export function useAlertCount() {
  const rendiciones = useQuery({ queryKey: ['sessions', 'pending-settlements'], queryFn: sessionService.getPendingSettlements, refetchInterval: 60_000 })
  const bajas = useQuery({ queryKey: ['customers', 'removal-requests', 'Pending', 1], queryFn: () => customerService.removals('Pending', 1), refetchInterval: 60_000 })
  const fueraDeRecorrido = useQuery({ queryKey: uncoveredKey(1), queryFn: () => scheduleService.uncovered(1), refetchInterval: 30_000 })
  const activas = [rendiciones.data?.length, bajas.data?.pendingCount, fueraDeRecorrido.data?.totalCount].filter(Boolean).length
  return { activas, cargando: rendiciones.isPending || bajas.isPending || fueraDeRecorrido.isPending }
}
