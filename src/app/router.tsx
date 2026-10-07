import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginView, ProtectedRoute, ROLES } from '../modules/auth'
import { RegisterDeliveryView, CustomerVisitView } from '../modules/deliveries'
import { ProductFormView, ProductListView } from '../modules/products'
import {
  DeliveryRouteView,
  DriverSessionLayout,
  ReceiveSessionView,
  RouteSettlementView,
  SessionDetailView,
  SessionListView,
} from '../modules/sessions'
import { VehicleLoadView } from '../modules/vehicleLoads'
import { VehicleListView, VehicleFormView } from '../modules/vehicles'
import { DriverListView, DriverFormView } from '../modules/drivers'
import { ZoneFormView, ZoneListView } from '../modules/zones'
import { HomeView } from './HomeView'
import { AdminLayout } from './admin/AdminLayout'
import { AdminHomeView } from './admin/AdminHomeView'
import { CustomerFormView, CustomerListView } from '../modules/customers'

/**
 * Router global. Ensambla las vistas que cada modulo expone por su index; las vistas
 * viven adentro de su modulo para que el arbol siga contando de que se trata el
 * negocio y no de que tecnologia se uso.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeView />} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.driver]} />}>
        <Route element={<DriverSessionLayout />}>
          <Route path="/reparto" element={<DeliveryRouteView />} />
          <Route path="/reparto/visita" element={<RegisterDeliveryView />} />
          <Route path="/reparto/clientes/:id" element={<CustomerVisitView />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.admin]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/panel" element={<AdminHomeView />} />
          <Route path="/panel/vehiculos" element={<VehicleListView />} />
          <Route path="/panel/vehiculos/nuevo" element={<VehicleFormView />} />
          <Route path="/panel/vehiculos/:id" element={<VehicleFormView />} />
          <Route path="/panel/choferes" element={<DriverListView />} />
          <Route path="/panel/choferes/nuevo" element={<DriverFormView />} />
          <Route path="/panel/choferes/:id" element={<DriverFormView />} />
          <Route path="/panel/clientes" element={<CustomerListView />} />
          <Route path="/panel/clientes/nuevo" element={<CustomerFormView />} />
          <Route path="/panel/clientes/:id" element={<CustomerFormView />} />
          <Route path="/panel/carga" element={<VehicleLoadView />} />

          <Route path="/panel/liquidacion" element={<RouteSettlementView />} />

          <Route path="/panel/salidas" element={<SessionListView />} />
          <Route path="/panel/salidas/:id" element={<SessionDetailView />} />
          <Route path="/panel/salidas/:id/recepcion" element={<ReceiveSessionView />} />

          {/* El segmento fijo le gana al dinamico en el router, asi que "nuevo" nunca
              se toma por un id. */}
          <Route path="/panel/catalogo" element={<ProductListView />} />
          <Route path="/panel/catalogo/nuevo" element={<ProductFormView />} />
          <Route path="/panel/catalogo/:id" element={<ProductFormView />} />

          <Route path="/panel/zonas" element={<ZoneListView />} />
          <Route path="/panel/zonas/nueva" element={<ZoneFormView />} />
          <Route path="/panel/zonas/:id" element={<ZoneFormView />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
