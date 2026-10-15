import { useQuery } from '@tanstack/react-query'
import { vehiclePerformanceService } from '../services/vehiclePerformanceService'
import { rangeError } from '../utils/period'

export function useVehiclePerformance(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'vehicle-performance', from, to],
    queryFn: () => vehiclePerformanceService.get(from, to),
    enabled: !rangeError({ from, to }),
  })
}
