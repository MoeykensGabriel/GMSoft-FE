import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProductFormView, ProductListView } from '../../modules/products/admin'
import {
  ReceiveSessionView,
  CorrectReceptionView,
  RouteSettlementView,
  DailySummaryView,
  SessionDetailView,
  SessionListView,
  AdminOpenSessionView,
} from '../../modules/sessions/admin'
import { VehicleLoadView, RemovedLoadsView, RestockView, RestockListView } from '../../modules/vehicleLoads'
import { VehicleListView, VehicleFormView } from '../../modules/vehicles/admin'
import { DriverListView, DriverFormView } from '../../modules/drivers/admin'
import { ZoneFormView, ZoneListView } from '../../modules/zones/admin'
import { CustomerDetailView, CustomerFormView, CustomerListView, RemovalRequestsView } from '../../modules/customers/admin'
import { RoutePlanningView } from '../../modules/routePlanning'
import { PromotionDetailView, PromotionListView } from '../../modules/promotions/admin'
import { ConfigurationView } from './ConfigurationView'
import { AdminLayout } from './AdminLayout'
import { AdminHomeView } from './AdminHomeView'

// Estadísticas carga la librería de gráficos: se baja recién al entrar.
const VehiclePerformanceView = lazy(() => import('../../modules/reports').then((module) => ({ default: module.VehiclePerformanceView })))

/**
 * Las pantallas del panel, bajo /panel. El router las carga aparte (lazy): el admin
 * las baja una vez al entrar y el celular del chofer no las descarga nunca.
 */
export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminHomeView />} />
        <Route path="configuracion" element={<ConfigurationView />} />
        <Route path="promociones" element={<PromotionListView />} />
        <Route path="promociones/:id" element={<PromotionDetailView />} />
        <Route path="vehiculos" element={<VehicleListView />} />
        <Route path="vehiculos/nuevo" element={<VehicleFormView />} />
        <Route path="vehiculos/:id" element={<VehicleFormView />} />
        <Route path="choferes" element={<DriverListView />} />
        <Route path="choferes/nuevo" element={<DriverFormView />} />
        <Route path="choferes/:id" element={<DriverFormView />} />
        <Route path="clientes" element={<CustomerListView />} />
        <Route path="recorridos" element={<RoutePlanningView />} />
        <Route path="clientes/nuevo" element={<CustomerFormView />} />
        <Route path="bajas" element={<RemovalRequestsView />} />
        <Route path="clientes/:id/editar" element={<CustomerFormView />} />
        <Route path="clientes/:id" element={<CustomerDetailView />} />
        <Route path="carga" element={<VehicleLoadView />} />
        <Route path="carga/bajadas" element={<RemovedLoadsView />} />

        <Route path="liquidacion" element={<RouteSettlementView />} />
        <Route path="resumen-diario" element={<DailySummaryView />} />
        <Route path="estadisticas" element={<Suspense fallback={<p className="p-6 text-muted">Cargando estadísticas...</p>}><VehiclePerformanceView /></Suspense>} />

        <Route path="salidas" element={<SessionListView />} />
        <Route path="salidas/abrir" element={<AdminOpenSessionView />} />
        <Route path="salidas/:id" element={<SessionDetailView />} />
        <Route path="salidas/:id/recepcion" element={<ReceiveSessionView />} />
        <Route path="salidas/:id/correccion" element={<CorrectReceptionView />} />
        <Route path="salidas/:id/recarga" element={<RestockView />} />
        <Route path="recargas" element={<RestockListView />} />

        {/* El segmento fijo le gana al dinamico en el router, asi que "nuevo" nunca
            se toma por un id. */}
        <Route path="catalogo" element={<ProductListView />} />
        <Route path="catalogo/nuevo" element={<ProductFormView />} />
        <Route path="catalogo/:id" element={<ProductFormView />} />

        <Route path="zonas" element={<ZoneListView />} />
        <Route path="zonas/nueva" element={<ZoneFormView />} />
        <Route path="zonas/:id" element={<ZoneFormView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
