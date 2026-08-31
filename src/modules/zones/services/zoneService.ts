import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface Zone {
  id: string
  name: string
  notes: string | null
  isActive: boolean
}

/** El alta no manda isActive: una zona recien creada siempre nace activa. */
export interface ZoneInput {
  name: string
  notes: string | null
  isActive?: boolean
}

export const zoneService = {
  /** Solo las activas: no tiene sentido ofrecer una zona dada de baja al salir. */
  listActive: (pageSize = 100) =>
    api.get<PagedResult<Zone>>(`/api/zones?onlyActive=true&pageSize=${pageSize}`),

  /**
   * Todas, para el admin. Sin filtrar por activa: si trajera solo las activas,
   * desactivar una zona la haria desaparecer y no habria como reactivarla.
   */
  list: (pageSize = 100) => api.get<PagedResult<Zone>>(`/api/zones?pageSize=${pageSize}`),

  getById: (id: string) => api.get<Zone>(`/api/zones/${id}`),

  create: (input: ZoneInput) => api.post<string>('/api/zones', input),

  /** El id va tambien en el cuerpo por claridad; el backend usa el de la ruta. */
  update: (id: string, input: ZoneInput) => api.put<void>(`/api/zones/${id}`, { id, ...input }),

  /** Solo si la zona no tiene clientes ni salidas; si los tiene el backend responde 409. */
  remove: (id: string) => api.del<void>(`/api/zones/${id}`),
}
