import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, Button, Field } from '../../core'
import { useAuth } from '../hooks/useAuth'

export function LoginForm({ onDone }: { onDone: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await login(email, password)
      onDone()
    } catch (err) {
      // El backend distingue credenciales malas (401) de cuenta bloqueada o
      // desactivada (403), y ese detalle le sirve al usuario para saber si insistir
      // o llamar a la oficina.
      if (err instanceof ApiError) {
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
