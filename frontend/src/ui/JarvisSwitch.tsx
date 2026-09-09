import { useId, type KeyboardEvent } from 'react'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  id?: string
  className?: string
}

export function JarvisSwitch({ checked, onChange, label, disabled, id, className }: Props) {
  const autoId = useId()
  const fieldId = id || autoId

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }

  return (
    <label className={['jarvis-switch', className].filter(Boolean).join(' ')} htmlFor={fieldId}>
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`jarvis-switch-track${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
        onKeyDown={onKey}
      >
        <span className="jarvis-switch-thumb" aria-hidden />
      </button>
      <span className="jarvis-switch-label">{label}</span>
    </label>
  )
}
