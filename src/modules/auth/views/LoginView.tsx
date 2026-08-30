import { useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

interface EstadoDeRuta {
  from?: { pathname: string }
}

export function LoginView() {
  const navigate = useNavigate()
  const location = useLocation()

  // Vuelve a donde queria ir antes de que lo mandaran al login.
  const destino = (location.state as EstadoDeRuta | null)?.from?.pathname ?? '/'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Inicio de sesion</h1>
      <LoginForm onDone={() => navigate(destino, { replace: true })} />
    </main>
  )
}
