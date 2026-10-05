import { api } from '../../core'
import type { PagedResult } from '../../core'

export interface DriverProfile {
  id: string
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  vehicleId: string | null
  vehicleName: string | null
  vehicleLicensePlate: string | null
  userName: string | null
  email: string | null
  isActive: boolean
}

export const driverService = {
  listActive: async (): Promise<DriverProfile[]> => {
    const drivers: DriverProfile[] = []
    for (let page = 1; ; page += 1) {
      const result = await api.get<PagedResult<DriverProfile>>(`/api/drivers?onlyActive=true&pageSize=100&page=${page}`)
      drivers.push(...result.items)
      if (!result.hasNextPage) return drivers
    }
  },
  /** El propio perfil, con el vehiculo asignado. El id sale del token. */
  getMe: () => api.get<DriverProfile>('/api/drivers/me'),
}
