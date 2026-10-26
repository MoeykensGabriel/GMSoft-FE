import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Field } from '../../core'
import { driverService } from '../services/driverService'
import { AccessCard } from './AccessCard'

export function DriverUserNameForm({ driverId, userName, password, phone, disabled }: {
  driverId: string; userName: string; password?: string | null; phone?: string; disabled: boolean
}) {
  const client = useQueryClient()
  const [newUserName, setNewUserName] = useState('')
  const change = useMutation({
    mutationFn: (value: string) => driverService.changeUserName(driverId, value),
    onSuccess: async () => {
      setNewUserName('')
      await client.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!disabled && !change.isPending && newUserName && newUserName !== userName) change.mutate(newUserName)
  }
  return <section className="border-t border-line pt-5">
    <h2 className="mb-2 font-semibold">Cambiar usuario</h2>
    <p className="mb-4 break-words text-sm text-muted">Usuario actual: {userName}. Al cambiarlo, el chofer tiene que volver a entrar con el usuario nuevo; la contraseña no cambia.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset disabled={disabled || change.isPending}>
        <Field label="Usuario nuevo" name="newUserName" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={50}
          pattern="[a-zA-Z0-9._\-]+" title="Letras, números, punto, guion y guion bajo, sin espacios."
          value={newUserName} onChange={(e) => { setNewUserName(e.target.value); if (!change.isPending) change.reset() }} />
      </fieldset>
      <ErrorMessage error={change.error} />
      {change.isSuccess && change.variables && <AccessCard key={change.variables} userName={change.variables} password={password} phone={phone} />}
      <Button type="submit" className="self-end" disabled={disabled || change.isPending || !newUserName || newUserName === userName}>{change.isPending ? 'Guardando...' : 'Cambiar usuario'}</Button>
    </form>
  </section>
}
