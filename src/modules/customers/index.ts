export { NO_PURCHASE_REASONS, noPurchaseLabel, validNoPurchase } from './utils/noPurchase'
export { REMOVAL_REASONS, removalLabel, validRemoval } from './utils/removal'
export type { RemovalReason, RemovalStatus } from './utils/removal'
export type { NoPurchaseReason, LastNoPurchase } from './utils/noPurchase'
export { customerService } from './services/customerService'
export { CustomerFormView } from './views/CustomerFormView'
export { CustomerDetailView } from './views/CustomerDetailView'
export { CustomerListView } from './views/CustomerListView'
export { RemovalRequestsView, RemovalRequestsNotice } from './views/RemovalRequestsView'
export { CustomerRouteList } from './components/CustomerRouteList'
export { CustomerAccountSummary } from './components/CustomerAccountSummary'
export { ActivitySettingsPanel } from './components/ActivitySettingsPanel'
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
