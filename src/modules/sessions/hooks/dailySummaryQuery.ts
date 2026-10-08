import { dailySummaryService } from '../services/dailySummaryService'

export const dailySummaryQuery = (vehicleId: string, date: string) => ({
  queryKey: ['sessions', 'daily-summary', vehicleId, date],
  queryFn: () => dailySummaryService.get(vehicleId, date),
  enabled: Boolean(vehicleId && date),
  staleTime: 0,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})
