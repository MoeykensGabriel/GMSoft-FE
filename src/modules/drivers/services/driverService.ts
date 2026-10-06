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

export type DriverInput = Pick<DriverProfile, 'firstName' | 'lastName' | 'documentNumber' | 'phone' | 'vehicleId' | 'isActive'>
export type NewDriverInput = Omit<DriverInput, 'isActive'> & { userName: string; password: string; email: string | null }

export const driverService = {
  listPage: (page: number, search: string, active: string) => api.get<PagedResult<DriverProfile>>(
    `/api/drivers?page=${page}&pageSize=20&search=${encodeURIComponent(search)}${active ? `&onlyActive=${active}` : ''}`),
  getById: (id: string) => api.get<DriverProfile>(`/api/drivers/${id}`),
  create: (input: NewDriverInput) => api.post<string>('/api/drivers', input),
  update: (id: string, input: DriverInput) => api.put<void>(`/api/drivers/${id}`, { id, ...input }),
  resetPassword: (id: string, newPassword: string) => api.put<void>(`/api/drivers/${id}/password`, { id, newPassword }),
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
