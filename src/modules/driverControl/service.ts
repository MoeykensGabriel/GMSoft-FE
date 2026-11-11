import { api } from '../core'
import type { NoPurchaseReason } from '../customers'

export interface DriverControlMark {
  /** Hora del celular si es confiable; si no, la de llegada al servidor. */
  at: string
  deliveredAt: string
  phoneTime: boolean
  customerName: string
  type: 'Sale' | 'ContainerOnly' | 'Promotion' | 'NoPurchase'
  noPurchaseReason: NoPurchaseReason | null
  offline: boolean
  doubtful: boolean
  inBurst: boolean
  outsideWorkingHours: boolean
}

export interface DriverControlBurst { start: string; end: string; count: number; serverTime: boolean }

export interface DriverControlSession {
  sessionId: string
  vehicleName: string
  licensePlate: string
  zoneName: string
  status: 'Open' | 'Closed' | 'Cancelled'
  openedAt: string
  openedOutsideWorkingHours: boolean
  loadedAt: string | null
  closedAt: string | null
  firstVisitAt: string | null
  lastVisitAt: string | null
  visits: number
  medianIntervalSeconds: number | null
  offlineVisits: number
  doubtfulVisits: number
  outsideHoursVisits: number
  noPurchase: number
  didNotWant: number
  bursts: DriverControlBurst[]
  marks: DriverControlMark[]
}

export interface DriverControlDriver {
  driverId: string
  driverName: string
  sessionCount: number
  visits: number
  bursts: number
  burstVisits: number
  offlineVisits: number
  doubtfulVisits: number
  outsideHoursVisits: number
  outsideHoursOpenings: number
  noPurchase: number
  didNotWant: number
  medianIntervalSeconds: number | null
  /** HH:mm:ss, hora argentina. */
  usualOpening: string | null
  sessions: DriverControlSession[]
}

export interface DriverControlReport {
  from: string
  to: string
  drivers: DriverControlDriver[]
  burstGapSeconds: number
  burstMinVisits: number
  offlineDelayMinutes: number
}

export const driverControlService = {
  get: (from: string, to: string) =>
    api.get<DriverControlReport>(`/api/reports/driver-control?${new URLSearchParams({ from, to })}`),
}
