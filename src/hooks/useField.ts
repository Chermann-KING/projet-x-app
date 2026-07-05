import { useCallback, useEffect, useRef, useState } from 'react'

export type FieldStatus = 'idle' | 'saving' | 'success' | 'error'

export interface FieldState<T> {
  value: T
  setValue: (v: T) => void
  isDirty: boolean
  isSaving: boolean
  status: FieldStatus
  /** Populated when status === 'error'. Null otherwise. */
  error: Error | null
  onBlur: () => void
}

const SUCCESS_DISPLAY_MS = 1500

/**
 * Manages per-field dirty state, auto-save on blur, and anti-rafale guard.
 *
 * Anti-rafale: if onBlur fires while a save is already in progress,
 * sets a pendingSave flag instead of calling onSave again. Once the
 * current save completes, the loop retries with the latest value.
 */
export function useField<T>(
  initial: T,
  onSave: (v: T) => Promise<void>,
): FieldState<T> {
  const [value, setValue] = useState<T>(initial)
  const [initialValue, setInitialValue] = useState<T>(initial)
  const [status, setStatus] = useState<FieldStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  // Refs keep async callbacks free of stale closures
  const valueRef = useRef<T>(initial)
  const initialRef = useRef<T>(initial)
  const onSaveRef = useRef(onSave)
  const isSavingRef = useRef(false)
  const pendingSave = useRef(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { valueRef.current = value }, [value])
  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    },
    [],
  )

  const isDirty = value !== initialValue

  const handleSetValue = useCallback((newValue: T) => {
    // Sync update so onBlur triggered right after setValue sees the latest value
    valueRef.current = newValue
    setValue(newValue)
    if (status === 'error') {
      setStatus('idle')
      setError(null)
    }
  }, [status])

  const doSave = useCallback(async () => {
    let valueToSave = valueRef.current

    while (true) {
      if (valueToSave === initialRef.current) break

      isSavingRef.current = true
      pendingSave.current = false
      setStatus('saving')

      try {
        await onSaveRef.current(valueToSave)
        initialRef.current = valueToSave
        setInitialValue(valueToSave)
      } catch (err) {
        isSavingRef.current = false
        setError(err instanceof Error ? err : new Error(String(err)))
        setStatus('error')
        return
      }

      // A blur occurred while this save was running — retry with latest value
      const latest = valueRef.current
      if (pendingSave.current || latest !== initialRef.current) {
        valueToSave = latest
      } else {
        break
      }
    }

    isSavingRef.current = false
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    setStatus('success')
    successTimerRef.current = setTimeout(() => setStatus('idle'), SUCCESS_DISPLAY_MS)
  }, [])

  const onBlur = useCallback(() => {
    if (valueRef.current === initialRef.current) return
    if (isSavingRef.current) {
      pendingSave.current = true
      return
    }
    void doSave()
  }, [doSave])

  return {
    value,
    setValue: handleSetValue,
    isDirty,
    isSaving: status === 'saving',
    status,
    error: status === 'error' ? error : null,
    onBlur,
  }
}
