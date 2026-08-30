import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface Zone {
  id: string
  name: string
  notes: string | null
  isActive: boolean
}

export const zoneService = {
  /** Solo las activas: no tiene sentido ofrecer una zona dada de baja al salir. */
  listActive: (pageSize = 100) =>
    api.get<PagedResult<Zone>>(`/api/zones?onlyActive=true&pageSize=${pageSize}`),
}
