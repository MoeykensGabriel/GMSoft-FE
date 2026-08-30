import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginView, ProtectedRoute, ROLES } from '../modules/auth'
import { RegisterDeliveryView } from '../modules/deliveries'
import { CloseSessionView, DeliveryRouteView } from '../modules/sessions'
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
