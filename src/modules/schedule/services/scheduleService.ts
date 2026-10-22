import type { OrderedZone } from '../../zones'
import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface ScheduleDay { day: number; zones: OrderedZone[]; zoneId: string | null; zoneName: string | null }
export interface VehicleSchedule { vehicleId: string; isConfigured: boolean; isSuggested: boolean; days: ScheduleDay[] }
export interface SuggestedZone extends VehicleSchedule { zones: OrderedZone[]; zoneId: string | null; zoneName: string | null; routeDays: number[] }
export interface CoverageDay { day: number; scheduledZoneId: string | null; scheduledZoneName: string | null; matches: boolean | null }
export interface Coverage { covered: boolean | null; days: CoverageDay[] }
export interface CoverageInput { vehicleId: string; zoneId: string; visitDays: number[] }
export interface UncoveredCustomer extends CoverageInput { id: string; displayName: string; address: string; zoneName: string | null; uncoveredDays: number[] }
export const uncoveredKey = (page: number) => ['route-planning', 'uncovered', { page, pageSize: 50 }] as const
export const scheduleService = {
  get: (id: string) => api.get<VehicleSchedule>(`/api/vehicles/${id}/schedule`),
  save: (id: string, days: { day: number; zoneId: null; zoneIds: string[] }[]) => api.put<VehicleSchedule>(`/api/vehicles/${id}/schedule`, { days }),
  suggested: (driverId?: string) => api.get<SuggestedZone>(`/api/sessions/suggested-zone${driverId ? `?driverId=${encodeURIComponent(driverId)}` : ''}`),
  coverage: (input: CoverageInput) => api.post<Coverage>('/api/route-planning/coverage', input),
  uncovered: (page: number) => api.get<PagedResult<UncoveredCustomer>>(`/api/route-planning/uncovered?page=${page}&pageSize=50`),
}
