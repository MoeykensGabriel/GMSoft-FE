/**
 * API publica del modulo auth. Lo de adentro es privado: otros modulos importan
 * desde aca y nunca desde una ruta interna.
 */
export { AuthProvider } from './states/AuthProvider'
export { useAuth } from './hooks/useAuth'
export { ProtectedRoute } from './components/ProtectedRoute'
export { LoginView } from './views/LoginView'
export { ROLES } from './services/authService'
export type { Role, CurrentUser } from './services/authService'
