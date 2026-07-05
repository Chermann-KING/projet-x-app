import { StyleSheet, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

export interface StepIndicatorProps {
  /** Labels des étapes dans l'ordre */
  steps: string[]
  /** Numéro de l'étape active (1-based) */
  currentStep: number
}

type StepState = 'done' | 'active' | 'upcoming'

const CIRCLE_SIZE = 36

function getState(index: number, currentStep: number): StepState {
  if (index + 1 < currentStep) return 'done'
  if (index + 1 === currentStep) return 'active'
  return 'upcoming'
}

function StepCircle({ state, index }: { state: StepState; index: number }) {
  const theme = useTheme()
  const bg =
    state === 'done' ? theme.success : state === 'active' ? theme.primary : theme.muted
  const fg = state === 'upcoming' ? theme.mutedForeground : theme.primaryForeground

  return (
    <View style={[styles.circle, { backgroundColor: bg }]}>
      {state === 'done' ? (
        <Check size={ds.size.icon.md} color={fg} strokeWidth={2.5} />
      ) : (
        <Text style={[styles.circleNumber, { color: fg }]}>{index + 1}</Text>
      )}
    </View>
  )
}

/**
 * Indicateur d'étapes réutilisable — paramétrable via `steps` et `currentStep`.
 *
 * Layout :
 *   [step cell (flex:1)] [connector (flex:1)] [step cell (flex:1)] …
 *
 * Chaque step cell est centré dans son slot → symétrie garantie quelle que
 * soit la largeur du container ou le nombre d'étapes.
 */
export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const theme = useTheme()

  type Item =
    | { kind: 'step'; index: number; label: string; state: StepState }
    | { kind: 'connector'; id: string; color: string }

  const items: Item[] = steps.flatMap((label, index): Item[] => {
    const state = getState(index, currentStep)
    // Le connecteur avant ce step est vert si le step précédent est terminé
    const connectorGreen = index < currentStep
    const result: Item[] = []
    if (index > 0) {
      result.push({
        kind: 'connector',
        id: `c${index}`,
        color: connectorGreen ? theme.success : theme.border,
      })
    }
    result.push({ kind: 'step', index, label, state })
    return result
  })

  return (
    <View style={styles.container}>
      {items.map((item) =>
        item.kind === 'connector' ? (
          <View
            key={item.id}
            style={[styles.connector, { backgroundColor: item.color }]}
          />
        ) : (
          <View key={item.label} style={styles.stepCell}>
            <StepCircle state={item.state} index={item.index} />
            <Text
              style={[
                styles.stepLabel,
                { color: theme.mutedForeground },
                item.state === 'active' && { color: theme.foreground, fontWeight: '700' },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ),
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCell: {
    flex: 2,
    alignItems: 'center',
    gap: ds.space[1] + 2,
  },
  connector: {
    flex: 1,
    height: 2,
    // Alignement vertical au centre de la bulle
    alignSelf: 'flex-start',
    marginTop: CIRCLE_SIZE / 2 - 1,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNumber: {
    ...ds.text.body,
    fontWeight: '700',
  },
  stepLabel: {
    ...ds.text.caption,
    textAlign: 'center',
  },
})
