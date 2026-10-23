import { Field } from '../../core'

/**
 * La contraseña que la oficina le pone al chofer. Se ve mientras se escribe: la elige
 * la oficina para dársela al chofer, no es secreta para quien la carga.
 */
export function PasswordFields({ password, onPasswordChange }: { password: string; onPasswordChange: (value: string) => void }) {
  return <div className="flex flex-col gap-3">
    <p className="text-sm text-muted">Al menos 8 caracteres, una mayúscula, una minúscula y un número.</p>
    <Field label="Contraseña nueva" name="newPassword" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
      required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Usá al menos 8 caracteres, una mayúscula, una minúscula y un número."
      value={password} onChange={(e) => onPasswordChange(e.target.value)} />
  </div>
}
