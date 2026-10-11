import { Image, StyleSheet, Text, View } from 'react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  name: string
  size?: AvatarSize
  isOnline?: boolean | null
  uri?: string | undefined
}

const FONT_SIZE: Record<AvatarSize, number> = { sm: 14, md: 16, lg: 18 }

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, size = 'lg', isOnline = null, uri }: AvatarProps): React.JSX.Element {
  const theme = useTheme()
  const diameter = ds.size.avatar[size]
  const fontSize = FONT_SIZE[size]

  return (
    <View style={{ width: diameter, height: diameter }}>
      <View
        style={[
          styles.circle,
          {
            width: diameter,
            height: diameter,
            borderRadius: ds.radius.avatar,
            backgroundColor: theme.primary,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: diameter, height: diameter, borderRadius: ds.radius.avatar }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initials,
              { color: theme.primaryForeground, fontSize },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>

      {isOnline !== null ? (
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: isOnline ? theme.success : theme.mutedForeground,
              borderColor: theme.background,
            },
          ]}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: ds.font.body,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: ds.size.indicator,
    height: ds.size.indicator,
    borderRadius: ds.radius.avatar,
    borderWidth: 2,
  },
})
