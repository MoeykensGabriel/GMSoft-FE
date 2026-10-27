import { vehicleService } from '../vehicles'

export const loadRangesQuery = (vehicleId: string) => ({
  queryKey: ['vehicles', 'load-ranges', vehicleId] as const,
  queryFn: () => vehicleService.getLoadRanges(vehicleId),
  enabled: Boolean(vehicleId),
})
