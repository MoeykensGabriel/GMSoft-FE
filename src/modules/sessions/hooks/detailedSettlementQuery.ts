import { sessionService } from '../services/sessionService'

/**
 * La consulta del detalle por cliente, compartida entre el detalle y los totales
 * para que lean la misma caché. Se refresca sola: la liquidación se va armando
 * mientras el chofer vende.
 */
export const detailedSettlementQuery = (sessionId: string) => ({
  queryKey: ['sessions', 'detailed-settlement', sessionId],
  queryFn: () => sessionService.getDetailedSettlement(sessionId),
  staleTime: 0,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})
