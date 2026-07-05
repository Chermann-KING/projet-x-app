import { StyleSheet, View } from 'react-native'
import { ds } from '@/shared/designSystem'

interface Props {
  children: React.ReactNode
  bg: string
  /** Taille carrée (width = height). Prioritaire sur width/height. */
  size?: number
  width?: number
  height?: number
  /** Défaut : ds.radius.sm (8 — carré arrondi). Passer ds.radius.avatar pour cercle. */
  radius?: number
}

export function IconBox({
  children,
  bg,
  size,
  width,
  height,
  radius = ds.radius.sm,
}: Props) {
  const w = size ?? width ?? 40
  const h = size ?? height ?? 40

  return (
    <View style={[styles.base, { width: w, height: h, borderRadius: radius, backgroundColor: bg }]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
