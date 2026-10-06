import { Field } from '../../core'

export function PasswordFields({ password, confirmation, onPasswordChange, onConfirmationChange }: {
  password: string; confirmation: string; onPasswordChange: (value: string) => void; onConfirmationChange: (value: string) => void
}) {
  return <div className="flex flex-col gap-3">
    <p className="text-sm text-neutral-600">Al menos 8 caracteres, una mayúscula, una minúscula y un número.</p>
    <Field label="Contraseña nueva" name="newPassword" type="password" autoComplete="new-password" required minLength={8}
      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Usá al menos 8 caracteres, una mayúscula, una minúscula y un número."
      value={password} onChange={(e) => onPasswordChange(e.target.value)} />
    <Field label="Repetir contraseña" name="confirmPassword" type="password" autoComplete="new-password" required
      value={confirmation} onChange={(e) => onConfirmationChange(e.target.value)}
      error={confirmation && confirmation !== password ? 'Las contraseñas no coinciden.' : undefined} />
  </div>
}
