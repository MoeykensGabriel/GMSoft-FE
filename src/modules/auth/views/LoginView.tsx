import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { PageHeader } from '../../core'

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
    <main className="flex min-h-screen flex-col bg-canvas">
      <div className="bg-brand-dark px-5 py-4 font-semibold text-white">GMSoft <span className="ml-2 text-sm font-normal">Gestión de reparto</span></div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <section className="ui-card flex w-full max-w-md flex-col gap-5 p-5">
          <PageHeader title="Inicio de sesión" description="Ingresá con tu usuario y contraseña." />
          {receptionCompleted && <p role="status" className="ui-card bg-accent-soft p-3 text-sm">ADMIN recibió el camión. Tu salida terminó y se cerró tu sesión.</p>}
          <LoginForm onDone={() => navigate(destino, { replace: true })} />
        </section>
      </div>
    </main>
  )
}
