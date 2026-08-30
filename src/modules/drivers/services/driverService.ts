import { api } from '../../core'

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
  /** El propio perfil, con el vehiculo asignado. El id sale del token. */
  getMe: () => api.get<DriverProfile>('/api/drivers/me'),
}
