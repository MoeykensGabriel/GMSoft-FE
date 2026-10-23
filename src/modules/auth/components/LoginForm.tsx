import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, Button, Field } from '../../core'
import { useAuth } from '../hooks/useAuth'

export function LoginForm({ onDone }: { onDone: () => void }) {
  const { login } = useAuth()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await login(userName, password)
      onDone()
    } catch (err) {
      // El backend distingue credenciales malas (401) de cuenta desactivada (403), y
      // ese detalle le sirve al usuario para saber si insistir o llamar a la oficina.
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
        label="Usuario"
        name="userName"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      {/* El ojo deja ver lo que se escribe: en el celular, con apuro, es fácil errarle a una letra. */}
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field
            label="Contraseña"
            name="password"
            type={verClave ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={verClave}
          onClick={() => setVerClave((v) => !v)}
          className="h-11 w-14 shrink-0 px-0"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {verClave && <path d="M4 4l16 16" />}
          </svg>
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
