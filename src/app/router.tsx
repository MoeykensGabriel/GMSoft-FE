import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginView, ProtectedRoute, ROLES } from '../modules/auth'
import { RegisterDeliveryView } from '../modules/deliveries'
import { ProductFormView, ProductListView } from '../modules/products'
import {
  CloseSessionView,
  DeliveryRouteView,
  SessionDetailView,
  SessionListView,
} from '../modules/sessions'
import { ZoneFormView, ZoneListView } from '../modules/zones'
import { HomeView } from './HomeView'

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
        <Route path="/reparto" element={<DeliveryRouteView />} />
        <Route path="/reparto/visita" element={<RegisterDeliveryView />} />
        <Route path="/reparto/cierre" element={<CloseSessionView />} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.admin]} />}>
        <Route path="/panel/salidas" element={<SessionListView />} />
        <Route path="/panel/salidas/:id" element={<SessionDetailView />} />

        {/* El segmento fijo le gana al dinamico en el router, asi que "nuevo" nunca
            se toma por un id. */}
        <Route path="/panel/catalogo" element={<ProductListView />} />
        <Route path="/panel/catalogo/nuevo" element={<ProductFormView />} />
        <Route path="/panel/catalogo/:id" element={<ProductFormView />} />

        <Route path="/panel/zonas" element={<ZoneListView />} />
        <Route path="/panel/zonas/nueva" element={<ZoneFormView />} />
        <Route path="/panel/zonas/:id" element={<ZoneFormView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
