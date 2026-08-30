import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginView, ProtectedRoute } from '../modules/auth'
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
