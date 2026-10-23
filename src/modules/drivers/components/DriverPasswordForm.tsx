import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, ErrorMessage } from '../../core'
import { driverService } from '../services/driverService'
import { AccessCard } from './AccessCard'
import { PasswordFields } from './PasswordFields'

export function DriverPasswordForm({ driverId, userName, phone, disabled }: { driverId: string; userName: string; phone?: string; disabled: boolean }) {
  const [password, setPassword] = useState('')
  const reset = useMutation({
    mutationFn: (value: string) => driverService.resetPassword(driverId, value),
    onSuccess: () => setPassword(''),
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!disabled && !reset.isPending && password) reset.mutate(password)
  }
  return <section className="border-t border-line pt-5">
    <h2 className="mb-2 font-semibold">Cambiar contraseña</h2>
    <p className="mb-4 text-sm text-muted">Nueva contraseña para el usuario {userName}. No hace falta conocer la anterior.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset disabled={disabled || reset.isPending}>
        <PasswordFields password={password} onPasswordChange={(value) => { setPassword(value); if (!reset.isPending) reset.reset() }} />
      </fieldset>
      <ErrorMessage error={reset.error} />
      {reset.isSuccess && reset.variables && <AccessCard userName={userName} password={reset.variables} phone={phone} />}
      <Button type="submit" className="self-end" disabled={disabled || reset.isPending}>{reset.isPending ? 'Guardando...' : 'Cambiar contraseña'}</Button>
    </form>
  </section>
}
