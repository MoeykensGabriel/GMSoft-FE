import { api } from '../../core'
import type { RouteFilters, RouteSave, RouteSnapshot } from '../types'

export const routePlanningKey = (filters: RouteFilters) => ['route-planning', 'list', filters] as const

export const routePlanningService = {
  get: (filters: RouteFilters) => api.get<RouteSnapshot>(`/api/route-planning?${new URLSearchParams({
    vehicleId: filters.vehicleId, zoneId: filters.zoneId, day: String(filters.day),
  })}`),
  save: (body: RouteSave) => api.put<RouteSnapshot>('/api/route-planning', body),
}
