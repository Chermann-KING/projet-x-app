import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useField } from '@/hooks/useField'

// ---------------------------------------------------------------------------
// Helper: save mock avec resolve/reject contrôlables
// ---------------------------------------------------------------------------

interface ControllableSave {
  onSave: jest.Mock<Promise<void>, []>
  settle: { ok: () => void; fail: (err?: Error) => void }
}

function makeControllableSave(): ControllableSave {
  const pending: Array<{ resolve: () => void; reject: (e: Error) => void }> = []

  const onSave = jest.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        pending.push({ resolve, reject })
      }),
  )

  return {
    onSave,
    settle: {
      ok: () => pending[pending.length - 1].resolve(),
      fail: (err = new Error('Network error')) => pending[pending.length - 1].reject(err),
    },
  }
}

// ---------------------------------------------------------------------------
// isDirty
// ---------------------------------------------------------------------------

describe('isDirty', () => {
  it('est false quand la valeur correspond à l\'initial', async () => {
    const { result } = await renderHook(() => useField<string>('hello', jest.fn()))
    expect(result.current.isDirty).toBe(false)
  })

  it('reste false quand setValue reçoit la même valeur', async () => {
    const { result } = await renderHook(() => useField<string>('hello', jest.fn()))
    await act(() => { result.current.setValue('hello') })
    expect(result.current.isDirty).toBe(false)
  })

  it('est true quand la valeur diffère de l\'initial', async () => {
    const { result } = await renderHook(() => useField<string>('hello', jest.fn()))
    await act(() => { result.current.setValue('world') })
    expect(result.current.isDirty).toBe(true)
  })

  it('repasse à false après une sauvegarde réussie', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderHook(() => useField<string>('initial', onSave))

    await act(() => { result.current.setValue('changed') })
    expect(result.current.isDirty).toBe(true)

    await act(() => { result.current.onBlur() })
    await waitFor(() => expect(result.current.isDirty).toBe(false))
  })
})

// ---------------------------------------------------------------------------
// Anti-rafale — pas de double appel pendant isSaving
// ---------------------------------------------------------------------------

describe('anti-rafale : pas de double appel onSave quand isSaving', () => {
  it('ignore un second onBlur pendant une sauvegarde en cours', async () => {
    const { onSave, settle } = makeControllableSave()
    const { result } = await renderHook(() => useField('initial', onSave))

    await act(() => { result.current.setValue('changed') })

    // Premier blur — déclenche la sauvegarde
    await act(() => { result.current.onBlur() })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(result.current.isSaving).toBe(true)

    // Second blur pendant la sauvegarde — NE DOIT PAS démarrer un second appel
    await act(() => { result.current.onBlur() })
    expect(onSave).toHaveBeenCalledTimes(1)

    // Résolution et vérification : exactement 1 appel au total
    await act(() => { settle.ok() })
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// pendingSave — retry après la première sauvegarde
// ---------------------------------------------------------------------------

describe('pendingSave : retry avec la dernière valeur après la première sauvegarde', () => {
  it('appelle onSave une seconde fois avec la valeur saisie pendant la première sauvegarde', async () => {
    const { onSave, settle } = makeControllableSave()
    const { result } = await renderHook(() => useField('initial', onSave))

    // Démarrer la première sauvegarde
    await act(() => { result.current.setValue('v1') })
    await act(() => { result.current.onBlur() })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenLastCalledWith('v1')

    // L'utilisateur saisit + blur pendant la sauvegarde → pendingSave
    await act(() => { result.current.setValue('v2') })
    await act(() => { result.current.onBlur() })
    expect(onSave).toHaveBeenCalledTimes(1) // pas encore de second appel

    // Résoudre la première → la boucle relance avec 'v2'
    await act(() => { settle.ok() })
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
    expect(onSave).toHaveBeenLastCalledWith('v2')
  })
})

// ---------------------------------------------------------------------------
// Transitions de statut
// ---------------------------------------------------------------------------

describe('status', () => {
  it('est "saving" pendant l\'exécution de onSave', async () => {
    const { onSave, settle } = makeControllableSave()
    const { result } = await renderHook(() => useField<string>('initial', onSave))

    await act(() => { result.current.setValue('changed') })
    await act(() => { result.current.onBlur() })

    expect(result.current.status).toBe('saving')
    expect(result.current.isSaving).toBe(true)

    await act(() => { settle.ok() })
  })

  it('passe à "success" puis "idle" après 1 500 ms', async () => {
    jest.useFakeTimers()
    const onSave = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderHook(() => useField<string>('initial', onSave))

    await act(() => { result.current.setValue('changed') })
    await act(() => { result.current.onBlur() })

    await waitFor(() => expect(result.current.status).toBe('success'))

    await act(() => { jest.advanceTimersByTime(1500) })
    expect(result.current.status).toBe('idle')

    jest.useRealTimers()
  })

  it('est "error" quand onSave lève une exception', async () => {
    const { onSave, settle } = makeControllableSave()
    const { result } = await renderHook(() => useField('initial', onSave))

    await act(() => { result.current.setValue('changed') })
    await act(() => { result.current.onBlur() })

    await act(() => { settle.fail() })
    expect(result.current.status).toBe('error')
  })

  it('efface "error" → "idle" quand l\'utilisateur retape', async () => {
    const { onSave, settle } = makeControllableSave()
    const { result } = await renderHook(() => useField('initial', onSave))

    await act(() => { result.current.setValue('changed') })
    await act(() => { result.current.onBlur() })
    await act(() => { settle.fail() })
    expect(result.current.status).toBe('error')

    await act(() => { result.current.setValue('retape') })
    expect(result.current.status).toBe('idle')
  })
})
