import { api } from '../core'
import type { WorkingDay, WorkingHours } from './types'

export const workingHoursQuery = {
  queryKey: ['working-hours'] as const,
  queryFn: () => api.get<WorkingHours>('/api/working-hours'),
}
export const saveWorkingHours = (body: { days: WorkingDay[] }) => api.put<WorkingHours>('/api/working-hours', body)
