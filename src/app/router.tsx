import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginView, ProtectedRoute, ROLES } from '../modules/auth'
import { RegisterDeliveryView, CustomerVisitView } from '../modules/deliveries'
import { DeliveryRouteView, DriverSessionLayout, OrganizeRouteView } from '../modules/sessions'
import { HomeView } from './HomeView'
import { PendingPromotions, RegisterPromotionView } from '../modules/promotions'

// El panel se baja recién al entrar: la app del chofer, que casi siempre es un
// celular con datos móviles, no descarga las pantallas de administración.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes').then((module) => ({ default: module.AdminRoutes })))

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
          <Route path="/reparto" element={<DeliveryRouteView promotions={<PendingPromotions />} />} />
          <Route path="/reparto/promocion" element={<RegisterPromotionView />} />
          <Route path="/reparto/organizar" element={<OrganizeRouteView />} />
          <Route path="/reparto/visita" element={<RegisterDeliveryView />} />
          <Route path="/reparto/clientes/:id" element={<CustomerVisitView />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.admin]} />}>
        <Route path="/panel/*" element={<Suspense fallback={<p className="p-6 text-muted">Cargando el panel...</p>}><AdminRoutes /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
