import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'

interface EstadoDeRuta {
  from?: { pathname: string }
  receptionCompleted?: boolean
}

export function LoginView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [receptionCompleted] = useState(() =>
    window.sessionStorage.getItem('gmsoft.reception-completed') === '1' ||
    Boolean((location.state as EstadoDeRuta | null)?.receptionCompleted))
  useEffect(() => {
    window.sessionStorage.removeItem('gmsoft.reception-completed')
  }, [])

  // Vuelve a donde queria ir antes de que lo mandaran al login.
  const destino = (location.state as EstadoDeRuta | null)?.from?.pathname ?? '/'
  if (user) return <Navigate to="/" replace />

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Inicio de sesion</h1>
      {receptionCompleted && <p role="status" className="max-w-sm text-center">ADMIN recibió el camión. Tu salida terminó y se cerró tu sesión.</p>}
      <LoginForm onDone={() => navigate(destino, { replace: true })} />
    </main>
  )
}
