export { NO_PURCHASE_REASONS, noPurchaseLabel, validNoPurchase } from './utils/noPurchase'
export { REMOVAL_REASONS, removalLabel, validRemoval } from './utils/removal'
export type { RemovalReason, RemovalStatus } from './utils/removal'
export type { NoPurchaseReason, LastNoPurchase } from './utils/noPurchase'
export { customerService } from './services/customerService'
export { CustomerRouteList } from './components/CustomerRouteList'
export { CustomerAccountSummary } from './components/CustomerAccountSummary'
export { CustomerProfileCard } from './components/CustomerProfileCard'
export { CustomerBalanceCard } from './components/CustomerBalanceCard'
export { CustomerAccountMovements } from './components/CustomerAccountMovements'
export { CustomerContainersSummary } from './components/CustomerContainersSummary'
export { purchaseActivityLabel } from './utils/activity'
export type {
  Customer,
  CustomerAccount,
  CustomerContainerLine,
  CustomerStatementEntry,
  CustomerRemoval,
} from './services/customerService'

export { RouteUpdateNotice } from './components/RouteUpdateNotice'
export { routeLaterStorage, useRouteLater } from './states/routeLaterStorage'
