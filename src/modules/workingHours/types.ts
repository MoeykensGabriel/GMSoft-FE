export interface WorkingDay {
  dayOfWeek: number
  isWorkingDay: boolean
  from: string | null
  until: string | null
  openingCutoff: string | null
}
export interface WorkingHours { isConfigured: boolean; days: WorkingDay[] }
export type WorkingHoursOperation = 'initial-load' | 'session-open' | 'restock' | 'visit' | 'promotion' | 'promotion-close' | 'session-close' | 'settlement'
export interface OutsideWorkingHoursEvent {
  operation: WorkingHoursOperation
  id: string
  occurredAt: string
  userId: string | null
  driverId: string | null
}
export interface SessionWorkingHours {
  openedOutsideWorkingHours: boolean
  closedOutsideWorkingHours: boolean
  settlementOutsideWorkingHours: boolean
  openedByUserId: string | null
  closedByUserId: string | null
  outsideWorkingHoursEvents: OutsideWorkingHoursEvent[]
}
