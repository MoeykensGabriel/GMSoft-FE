import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, ErrorMessage } from '../../core'
import { driverService } from '../services/driverService'
import { PasswordFields } from './PasswordFields'

export function DriverPasswordForm({ driverId, userName, disabled }: { driverId: string; userName: string; disabled: boolean }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const reset = useMutation({
    mutationFn: (value: string) => driverService.resetPassword(driverId, value),
    onSuccess: () => { setPassword(''); setConfirmation('') },
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!disabled && !reset.isPending && password === confirmation) reset.mutate(password)
  }
  return <section className="border-t border-line pt-5">
    <h2 className="mb-2 font-semibold">Cambiar contraseña</h2>
    <p className="mb-4 text-sm text-muted">Nueva contraseña para el usuario {userName}. No hace falta conocer la anterior.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset disabled={disabled || reset.isPending}>
        <PasswordFields password={password} confirmation={confirmation} onPasswordChange={(value) => { setPassword(value); reset.reset() }} onConfirmationChange={(value) => { setConfirmation(value); reset.reset() }} />
      </fieldset>
      <ErrorMessage error={reset.error} />
      {reset.isSuccess && <p role="status">Contraseña cambiada correctamente.</p>}
      <Button type="submit" className="self-end" disabled={disabled || reset.isPending}>{reset.isPending ? 'Guardando...' : 'Cambiar contraseña'}</Button>
    </form>
  </section>
}
